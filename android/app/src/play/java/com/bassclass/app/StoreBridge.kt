package com.bassclass.app

import android.app.Activity
import android.webkit.JavascriptInterface
import com.android.billingclient.api.AcknowledgePurchaseParams
import com.android.billingclient.api.BillingClient
import com.android.billingclient.api.BillingClientStateListener
import com.android.billingclient.api.BillingFlowParams
import com.android.billingclient.api.BillingResult
import com.android.billingclient.api.ConsumeParams
import com.android.billingclient.api.PendingPurchasesParams
import com.android.billingclient.api.ProductDetails
import com.android.billingclient.api.Purchase
import com.android.billingclient.api.PurchasesUpdatedListener
import com.android.billingclient.api.QueryProductDetailsParams
import com.android.billingclient.api.QueryPurchasesParams
import org.json.JSONArray
import org.json.JSONObject

/**
 * Google Play Billing for the Play build. The protocol is written at the top of web/js/billing.js: the page asks
 * (billingPrices, billingBuy, billingOwned, each with its request id) and every answer comes back as a
 * `bassclass-billing` event. BassClass Pro is a one-time product, acknowledged at once (Play refunds a purchase left
 * unacknowledged for three days); a tip is consumed at once, so it can be given again. No server: the phone asks Play
 * what the Google account owns. What Play says unasked (a pending purchase completed, a purchase that took longer than
 * the page waited) and the check on each return to the app come as { req: null, result: "update", ids, all }.
 */
open class StoreBridge(private val activity: Activity, private val send: (String) -> Unit) {

    /** The purchase waiting for Play's answer: its product, whether it is a tip, and the page's request. */
    private class Waiting(val id: String, val consumable: Boolean, val req: String)

    private var waiting: Waiting? = null
    private val queue = mutableListOf<Pair<() -> Unit, (String) -> Unit>>()
    private var connecting = false

    private val client: BillingClient = BillingClient.newBuilder(activity)
        .setListener(PurchasesUpdatedListener { result, purchases -> activity.runOnUiThread { onPurchases(result, purchases) } })
        .enablePendingPurchases(PendingPurchasesParams.newBuilder().enableOneTimeProducts().build())
        .enableAutoServiceReconnection()
        .build()

    // ---------------------------------------------------------------- the page's questions (on the bridge's thread)

    /** Each product's price in the player's currency: { req, result: "ok", prices: { id: "4,99 €" } }. */
    @JavascriptInterface
    fun billingPrices(idsJson: String, req: String) {
        activity.runOnUiThread {
            val ids = try {
                val a = JSONArray(idsJson)
                List(a.length()) { a.getString(it) }
            } catch (e: Exception) {
                emptyList()
            }
            details(ids, { list ->
                val prices = JSONObject()
                for (d in list) {
                    val price = d.oneTimePurchaseOfferDetailsList?.firstOrNull()?.formattedPrice
                    if (price != null) prices.put(d.productId, price)
                }
                answer(JSONObject().put("req", req).put("result", "ok").put("prices", prices))
            }, { why -> answer(failed(req, why)) })
        }
    }

    /** Buys a product (a tip: `consumable`); one purchase at a time. Play's sheet answers through onPurchases. */
    @JavascriptInterface
    fun billingBuy(id: String, consumable: Boolean, req: String) {
        activity.runOnUiThread {
            if (waiting != null) {
                answer(failed(req, "busy"))
                return@runOnUiThread
            }
            waiting = Waiting(id, consumable, req)
            details(listOf(id), { list -> launch(list.firstOrNull()) }, { why -> finish("error", why) })
        }
    }

    /** The one-time products the account owns (tips are consumed, never owned): { req, result: "ok", ids }. */
    @JavascriptInterface
    fun billingOwned(req: String) {
        activity.runOnUiThread {
            owned({ ids -> answer(JSONObject().put("req", req).put("result", "ok").put("ids", JSONArray(ids))) }, { why -> answer(failed(req, why)) })
        }
    }

    // ---------------------------------------------------------------- the app's life

    /** Back to the front: acknowledge or consume what is left over, and tell the page what the account owns. */
    fun storeResume() {
        owned({ ids -> answer(update(ids, true)) }, { })
    }

    fun storeDestroy() {
        try {
            client.endConnection()
        } catch (e: Exception) {
            // (already closed)
        }
    }

    // ---------------------------------------------------------------- Play

    /** Runs `action` once Play is connected (on the main thread); `fail` with the reason when it cannot connect. */
    private fun ready(action: () -> Unit, fail: (String) -> Unit) {
        if (client.isReady) {
            action()
            return
        }
        queue.add(action to fail)
        if (connecting) return
        connecting = true
        client.startConnection(object : BillingClientStateListener {
            override fun onBillingSetupFinished(result: BillingResult) {
                activity.runOnUiThread {
                    connecting = false
                    val list = queue.toList()
                    queue.clear()
                    val ok = result.responseCode == BillingClient.BillingResponseCode.OK
                    for ((a, f) in list) if (ok) a() else f(code(result))
                }
            }

            override fun onBillingServiceDisconnected() {
                activity.runOnUiThread {
                    connecting = false
                    val list = queue.toList()
                    queue.clear()
                    for ((_, f) in list) f("SERVICE_DISCONNECTED")
                }
            }
        })
    }

    /** The products' details, fresh from Play (Google: never cached), as one-time products. */
    private fun details(ids: List<String>, ok: (List<ProductDetails>) -> Unit, fail: (String) -> Unit) {
        if (ids.isEmpty()) {
            ok(emptyList())
            return
        }
        ready({
            val products = ids.map {
                QueryProductDetailsParams.Product.newBuilder().setProductId(it).setProductType(BillingClient.ProductType.INAPP).build()
            }
            val params = QueryProductDetailsParams.newBuilder().setProductList(products).build()
            client.queryProductDetailsAsync(params) { result, found ->
                activity.runOnUiThread {
                    if (result.responseCode == BillingClient.BillingResponseCode.OK) ok(found.productDetailsList) else fail(code(result))
                }
            }
        }, fail)
    }

    /** Opens Play's purchase sheet for the waiting purchase (on the main thread, as Play asks). */
    private fun launch(product: ProductDetails?) {
        val w = waiting ?: return
        if (product == null) {
            finish("error", "ITEM_UNAVAILABLE")
            return
        }
        val params = BillingFlowParams.newBuilder()
            .setProductDetailsParamsList(listOf(BillingFlowParams.ProductDetailsParams.newBuilder().setProductDetails(product).build()))
            .build()
        val result = client.launchBillingFlow(activity, params)
        when (result.responseCode) {
            BillingClient.BillingResponseCode.OK -> { /* Play's sheet is open: its answer comes through onPurchases */ }
            BillingClient.BillingResponseCode.USER_CANCELED -> finish("cancel")
            BillingClient.BillingResponseCode.ITEM_ALREADY_OWNED -> alreadyOwned(w)
            else -> finish("error", code(result))
        }
    }

    /** Play's answer to a purchase, or news of one made earlier (a pending purchase completed). */
    private fun onPurchases(result: BillingResult, purchases: List<Purchase>?) {
        val w = waiting
        when (result.responseCode) {
            BillingClient.BillingResponseCode.OK -> {
                val list = purchases.orEmpty()
                val bought = list.filter { it.purchaseState == Purchase.PurchaseState.PURCHASED }
                bought.forEach { settle(it) }
                val ids = bought.flatMap { it.products }.distinct()
                val pending = list.any { it.purchaseState == Purchase.PurchaseState.PENDING }
                when {
                    w != null && w.id in ids -> finish("ok", ids = ids)
                    w != null && pending -> finish("pending")
                    else -> {
                        if (ids.isNotEmpty()) answer(update(ids.filter { !isTip(it) }, false))
                        if (w != null) finish("error", "no purchase of ${w.id}")
                    }
                }
            }
            BillingClient.BillingResponseCode.USER_CANCELED -> finish("cancel")
            BillingClient.BillingResponseCode.ITEM_ALREADY_OWNED -> if (w != null) alreadyOwned(w)
            else -> finish("error", code(result))
        }
    }

    /** Pro already bought (a new phone, a reinstall): owned. A tip still waiting to be consumed: consumed, try again. */
    private fun alreadyOwned(w: Waiting) {
        if (w.consumable) {
            owned({ }, { })
            finish("error", "a tip still being processed: try again")
        } else {
            finish("owned")
        }
    }

    /** What the account owns: every purchase is acknowledged (Pro) or consumed (a tip) on the way. */
    private fun owned(ok: (List<String>) -> Unit, fail: (String) -> Unit) {
        ready({
            client.queryPurchasesAsync(QueryPurchasesParams.newBuilder().setProductType(BillingClient.ProductType.INAPP).build()) { result, list ->
                activity.runOnUiThread {
                    // (Play could not be asked: an error, never "owns nothing", which would take Pro away)
                    if (result.responseCode != BillingClient.BillingResponseCode.OK) {
                        fail(code(result))
                    } else {
                        list.forEach { settle(it) }
                        ok(list.filter { it.purchaseState == Purchase.PurchaseState.PURCHASED }.flatMap { it.products }.filter { !isTip(it) }.distinct())
                    }
                }
            }
        }, fail)
    }

    /** A completed purchase: Pro acknowledged once, a tip consumed (a failure is tried again at the next check). */
    private fun settle(p: Purchase) {
        if (p.purchaseState != Purchase.PurchaseState.PURCHASED) return
        if (p.products.any { isTip(it) }) {
            client.consumeAsync(ConsumeParams.newBuilder().setPurchaseToken(p.purchaseToken).build()) { _, _ -> }
        } else if (!p.isAcknowledged) {
            client.acknowledgePurchase(AcknowledgePurchaseParams.newBuilder().setPurchaseToken(p.purchaseToken).build()) { _ -> }
        }
    }

    // ---------------------------------------------------------------- answers to the page

    /** Answers the waiting purchase. */
    private fun finish(result: String, error: String? = null, ids: List<String> = emptyList()) {
        val w = waiting ?: return
        waiting = null
        val o = JSONObject().put("req", w.req).put("result", result).put("id", w.id).put("ids", JSONArray(ids))
        if (error != null) o.put("error", error)
        answer(o)
    }

    private fun answer(o: JSONObject) {
        send("window.dispatchEvent(new CustomEvent('bassclass-billing',{detail:$o}))")
    }

    private fun failed(req: String, why: String): JSONObject = JSONObject().put("req", req).put("result", "error").put("error", why)

    private fun update(ids: List<String>, all: Boolean): JSONObject =
        JSONObject().put("req", JSONObject.NULL).put("result", "update").put("ids", JSONArray(ids)).put("all", all)

    private fun code(result: BillingResult): String = "code ${result.responseCode}${if (result.debugMessage.isNullOrEmpty()) "" else ": ${result.debugMessage}"}"

    /** The tips are the consumable products (`bassclass_tip_2`, `bassclass_tip_4`: web/js/pro.js TIPS). */
    private fun isTip(id: String) = id.startsWith("bassclass_tip")
}
