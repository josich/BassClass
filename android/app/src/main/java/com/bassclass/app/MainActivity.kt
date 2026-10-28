package com.bassclass.app

import android.Manifest
import android.annotation.SuppressLint
import android.annotation.TargetApi
import android.app.Activity
import android.content.Intent
import android.content.pm.PackageManager
import android.media.AudioAttributes
import android.media.AudioDeviceCallback
import android.media.AudioDeviceInfo
import android.media.AudioManager
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.view.View
import android.view.ViewGroup
import android.view.WindowInsets
import android.view.WindowInsetsController
import android.view.WindowManager
import android.webkit.JavascriptInterface
import android.webkit.PermissionRequest
import android.webkit.RenderProcessGoneDetail
import android.webkit.ValueCallback
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebView
import android.webkit.WebViewClient
import android.window.OnBackInvokedDispatcher
import androidx.webkit.WebViewAssetLoader
import androidx.webkit.WebViewCompat
import androidx.webkit.WebViewFeature
import com.google.android.play.core.review.ReviewManagerFactory

/**
 * Hosts the BassClass web app (packaged from ../../web as assets) in a
 * full-screen landscape WebView. Assets are served from a virtual https
 * origin so ES modules, localStorage and Web Audio behave as on the web.
 */
class MainActivity : Activity() {

    private lateinit var web: WebView
    private var webGone = false                                   // the page's renderer crashed: the activity starts again
    private var bridge: NativeBridge? = null
    private var pendingMic: PermissionRequest? = null
    private var pendingSave: String? = null                       // a backup waiting for its "Save to" place
    private var pendingFiles: ValueCallback<Array<Uri>>? = null   // a file input waiting for the picker
    private val audio by lazy { getSystemService(AUDIO_SERVICE) as AudioManager }

    private val mainHandler = Handler(Looper.getMainLooper())

    /** "external" when headphones or an external speaker play the sound, else "speaker" (the phone's own). */
    private fun audioRoute(): String {
        // Android 13+: the devices that actually play media now (a connected but idle device does not count)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            val media = AudioAttributes.Builder()
                .setUsage(AudioAttributes.USAGE_MEDIA)
                .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
                .build()
            val playing = try { audio.getAudioDevicesForAttributes(media) } catch (e: Exception) { emptyList() }
            // only the phone's own speaker gets the phone-speaker sound; docks, car audio, casting
            // and any other output get the natural sound
            if (playing.isNotEmpty()) return if (playing.all { it.type in BUILTIN_SPEAKERS }) "speaker" else "external"
        }
        // older Android: headphones or an external speaker take over media output as soon as they connect
        val external = audio.getDevices(AudioManager.GET_DEVICES_OUTPUTS).any { it.type in EXTERNAL_OUTPUTS }
        return if (external) "external" else "speaker"
    }

    /** Tells the web app when headphones or a speaker are connected or disconnected. */
    private val routeCallback = object : AudioDeviceCallback() {
        override fun onAudioDevicesAdded(addedDevices: Array<out AudioDeviceInfo>?) = routeChanged()
        override fun onAudioDevicesRemoved(removedDevices: Array<out AudioDeviceInfo>?) = routeChanged()
    }

    /** Media may switch to a new device a moment after it connects: report now and again shortly after. */
    private fun routeChanged() {
        pushRoute()
        mainHandler.postDelayed({ pushRoute() }, 700)
        mainHandler.postDelayed({ pushRoute() }, 2000)
    }

    private fun pushRoute() {
        if (!::web.isInitialized) return
        web.evaluateJavascript("window.dispatchEvent(new CustomEvent('bassclass-route',{detail:'${audioRoute()}'}))", null)
    }

    /** Runs a line of JavaScript in the page (on the main thread). */
    private fun runJs(js: String) {
        runOnUiThread { if (::web.isInitialized && !webGone) web.evaluateJavascript(js, null) }
    }

    /**
     * Read by the web app at start-up (web/js/audio.js): window.BassClassNative.audioRoute(). Its store methods come
     * from the build's StoreBridge: Google Play Billing in the Play build (src/play), none in the GitHub build.
     */
    private inner class NativeBridge : StoreBridge(this@MainActivity, { js -> this@MainActivity.runJs(js) }) {
        @JavascriptInterface
        fun audioRoute(): String = this@MainActivity.audioRoute()

        /** Settings → Save a backup (web/js/backup.js): Android's "Save to" picker; the answer comes back as a 'bassclass-saved' event. */
        @JavascriptInterface
        fun saveFile(name: String, text: String) {
            runOnUiThread {
                // (one picker at a time: a second tap while one is open is ignored)
                if (pendingSave != null) return@runOnUiThread
                pendingSave = text
                val intent = Intent(Intent.ACTION_CREATE_DOCUMENT)
                    .addCategory(Intent.CATEGORY_OPENABLE)
                    .setType("application/json")
                    .putExtra(Intent.EXTRA_TITLE, name)
                try {
                    startActivityForResult(intent, REQ_SAVE)
                } catch (e: Exception) {
                    pendingSave = null
                    saved("error")
                }
            }
        }

        /**
         * Settings → Support BassClass → Rate (web/js/ui/proDebug.js): BassClass's page in the Play Store app, or on the
         * web when the phone has no Play Store.
         */
        @JavascriptInterface
        fun openStore() {
            runOnUiThread {
                val id = packageName
                try {
                    startActivity(Intent(Intent.ACTION_VIEW, Uri.parse("market://details?id=$id")).setPackage("com.android.vending"))
                } catch (e: Exception) {
                    try {
                        startActivity(Intent(Intent.ACTION_VIEW, Uri.parse("https://play.google.com/store/apps/details?id=$id")))
                    } catch (e2: Exception) {
                        // (no store and no browser: nothing to open)
                    }
                }
            }
        }

        /**
         * The rate reminder (web/js/ui/rate.js): Google Play's own rating card over the app ("in-app review"). Play
         * decides whether it shows (a quota, and only in an app installed from Play) and never says whether the player
         * rated, so the answer is only "done" or "error", as a 'bassclass-review' event.
         */
        @JavascriptInterface
        fun requestReview() {
            runOnUiThread {
                try {
                    val manager = ReviewManagerFactory.create(this@MainActivity)
                    manager.requestReviewFlow().addOnCompleteListener { request ->
                        if (request.isSuccessful) {
                            manager.launchReviewFlow(this@MainActivity, request.result).addOnCompleteListener { reviewed("done") }
                        } else reviewed("error")
                    }
                } catch (e: Exception) {
                    reviewed("error")
                }
            }
        }

        /**
         * Settings → Feedback (web/js/feedback.js): the phone's e-mail apps, with the address, subject and message filled
         * in; a phone without one answers with a 'bassclass-mail' event ("none").
         */
        @JavascriptInterface
        fun sendMail(to: String, subject: String, body: String) {
            runOnUiThread { openMail(to, subject, body) }
        }
    }

    private fun openMail(to: String, subject: String, body: String) {
        // (the address, subject and body in the mailto: URI, which e-mail apps read; subject and body as extras too)
        val uri = Uri.parse("mailto:" + Uri.encode(to, "@") + "?subject=" + Uri.encode(subject) + "&body=" + Uri.encode(body))
        val intent = Intent(Intent.ACTION_SENDTO, uri)
            .putExtra(Intent.EXTRA_SUBJECT, subject)
            .putExtra(Intent.EXTRA_TEXT, body)
        try {
            startActivity(intent)
        } catch (e: Exception) {
            web.evaluateJavascript("window.dispatchEvent(new CustomEvent('bassclass-mail',{detail:'none'}))", null)
        }
    }

    private fun reviewed(result: String) {
        web.evaluateJavascript("window.dispatchEvent(new CustomEvent('bassclass-review',{detail:'$result'}))", null)
    }

    private fun saved(result: String) {
        web.evaluateJavascript("window.dispatchEvent(new CustomEvent('bassclass-saved',{detail:'$result'}))", null)
    }

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)

        val loader = WebViewAssetLoader.Builder()
            .addPathHandler("/assets/", MimeFixingHandler(WebViewAssetLoader.AssetsPathHandler(this)))
            .build()

        web = WebView(this).apply {
            settings.javaScriptEnabled = true
            settings.domStorageEnabled = true
            settings.mediaPlaybackRequiresUserGesture = false
            // the page is the app's own files, served from the assets: no files or content providers of the phone
            settings.allowFileAccess = false
            settings.allowContentAccess = false
            // Android's largest font sizes (up to 200%) squeeze the exercise screen: the text grows up to 130% at most
            settings.textZoom = settings.textZoom.coerceAtMost(130)
            setBackgroundColor(0xFF12142A.toInt())
            // the Play build: the page knows it before any of its scripts runs (web/js/pro.js: the Pro gates on, no
            // debug panel); MimeFixingHandler also writes it into index.html, for WebViews without this feature
            if (BuildConfig.STORE.isNotEmpty() && WebViewFeature.isFeatureSupported(WebViewFeature.DOCUMENT_START_SCRIPT)) {
                WebViewCompat.addDocumentStartJavaScript(this, "window.BASS_STORE='${BuildConfig.STORE}';", setOf(ORIGIN))
            }
            // the sound profile follows the output: phone speaker or headphones/external speaker
            val b = NativeBridge()
            bridge = b
            addJavascriptInterface(b, "BassClassNative")
            webViewClient = object : WebViewClient() {
                override fun shouldInterceptRequest(view: WebView, request: WebResourceRequest): WebResourceResponse? =
                    loader.shouldInterceptRequest(request.url)

                // a mailto: link (an older page, or a link in a text) goes to the e-mail apps, not to an error page;
                // any other address than the app's own opens outside the app, so no other page ever sees the bridge
                override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean {
                    val url = request.url
                    if (url.scheme != "mailto") {
                        if (url.host == HOST) return false
                        try {
                            startActivity(Intent(Intent.ACTION_VIEW, url))
                        } catch (e: Exception) {
                            // (nothing on the phone opens it)
                        }
                        return true
                    }
                    // (a mailto: URI is opaque: its address, subject and body are read by hand)
                    val ssp = url.encodedSchemeSpecificPart ?: ""
                    val q = ssp.substringAfter('?', "").split('&').mapNotNull { p ->
                        p.split('=', limit = 2).takeIf { it.size == 2 }?.let { it[0].lowercase() to Uri.decode(it[1]) }
                    }.toMap()
                    openMail(Uri.decode(ssp.substringBefore('?')), q["subject"] ?: "", q["body"] ?: "")
                    return true
                }

                // the page's renderer crashed or was stopped to free memory: the app starts its page again instead of
                // closing (launch review, 2026-10-28)
                @TargetApi(Build.VERSION_CODES.O)
                override fun onRenderProcessGone(view: WebView, detail: RenderProcessGoneDetail): Boolean {
                    webGone = true
                    (view.parent as? ViewGroup)?.removeView(view)
                    view.destroy()
                    recreate()
                    return true
                }
            }
            // the tuner asks for the microphone: forward it to Android's permission dialog
            webChromeClient = object : WebChromeClient() {
                override fun onPermissionRequest(request: PermissionRequest) {
                    runOnUiThread {
                        // (only the app's own pages get the microphone)
                        if (request.origin?.host != HOST || !request.resources.contains(PermissionRequest.RESOURCE_AUDIO_CAPTURE)) {
                            request.deny()
                        } else if (checkSelfPermission(Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED) {
                            request.grant(arrayOf(PermissionRequest.RESOURCE_AUDIO_CAPTURE))
                        } else {
                            pendingMic = request
                            requestPermissions(arrayOf(Manifest.permission.RECORD_AUDIO), REQ_MIC)
                        }
                    }
                }

                // Settings → Load a backup: the page's file input opens Android's file picker
                override fun onShowFileChooser(view: WebView, callback: ValueCallback<Array<Uri>>, params: FileChooserParams): Boolean {
                    pendingFiles?.onReceiveValue(null)
                    pendingFiles = callback
                    val intent = Intent(Intent.ACTION_OPEN_DOCUMENT).addCategory(Intent.CATEGORY_OPENABLE).setType("*/*")
                    return try {
                        startActivityForResult(intent, REQ_FILE)
                        true
                    } catch (e: Exception) {
                        pendingFiles = null
                        false
                    }
                }
            }
        }
        setContentView(web)
        hideSystemBars()
        audio.registerAudioDeviceCallback(routeCallback, Handler(Looper.getMainLooper()))

        // Android 13+ (and always from Android 16, API 36): Back arrives here, not in onBackPressed
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            onBackInvokedDispatcher.registerOnBackInvokedCallback(OnBackInvokedDispatcher.PRIORITY_DEFAULT) { goBack() }
        }

        // (a page kept by Android comes back as it was; after a renderer crash there is none: a fresh start)
        if (savedInstanceState == null || web.restoreState(savedInstanceState) == null) web.loadUrl("$ORIGIN/assets/index.html")
    }

    override fun onRequestPermissionsResult(requestCode: Int, permissions: Array<out String>, grantResults: IntArray) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        if (requestCode != REQ_MIC) return
        val req = pendingMic ?: return
        pendingMic = null
        if (grantResults.firstOrNull() == PackageManager.PERMISSION_GRANTED) req.grant(arrayOf(PermissionRequest.RESOURCE_AUDIO_CAPTURE))
        else req.deny()
    }

    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)
        when (requestCode) {
            REQ_SAVE -> {
                val text = pendingSave
                pendingSave = null
                val uri = data?.data
                if (resultCode != RESULT_OK || uri == null || text == null) {
                    saved("cancel")
                    return
                }
                val ok = try {
                    contentResolver.openOutputStream(uri, "w")?.use { it.write(text.toByteArray(Charsets.UTF_8)) } != null
                } catch (e: Exception) {
                    false
                }
                saved(if (ok) "ok" else "error")
            }
            REQ_FILE -> {
                pendingFiles?.onReceiveValue(WebChromeClient.FileChooserParams.parseResult(resultCode, data))
                pendingFiles = null
            }
        }
    }

    override fun onWindowFocusChanged(hasFocus: Boolean) {
        super.onWindowFocusChanged(hasFocus)
        if (hasFocus) hideSystemBars()
    }

    override fun onSaveInstanceState(outState: Bundle) {
        super.onSaveInstanceState(outState)
        if (!webGone) web.saveState(outState)
    }

    /** Back goes through the web app's history; at its start the app goes to the background, as Android does. */
    private fun goBack() {
        if (web.canGoBack()) web.goBack() else moveTaskToBack(true)
    }

    // (Android 12 and older)
    @Deprecated("Back is routed to the web app's history")
    override fun onBackPressed() {
        if (web.canGoBack()) web.goBack() else @Suppress("DEPRECATION") super.onBackPressed()
    }

    override fun onPause() {
        web.onPause()
        super.onPause()
    }

    override fun onDestroy() {
        bridge?.storeDestroy()
        mainHandler.removeCallbacksAndMessages(null)
        audio.unregisterAudioDeviceCallback(routeCallback)
        super.onDestroy()
    }

    override fun onResume() {
        super.onResume()
        web.onResume()
        // (Google Play asks for this on every return: purchases acknowledged, a pending one found)
        bridge?.storeResume()
    }

    private fun hideSystemBars() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            window.insetsController?.let {
                it.hide(WindowInsets.Type.systemBars())
                it.systemBarsBehavior = WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
            }
        } else {
            @Suppress("DEPRECATION")
            window.decorView.systemUiVisibility = (View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                or View.SYSTEM_UI_FLAG_FULLSCREEN
                or View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                or View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                or View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                or View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN)
        }
    }

    private companion object {
        /** The app's own pages: its assets, served on this virtual https address. */
        const val HOST = "appassets.androidplatform.net"
        const val ORIGIN = "https://$HOST"
        const val REQ_MIC = 7
        const val REQ_SAVE = 8
        const val REQ_FILE = 9

        /** Outputs that can play real bass: headphones, headsets, Bluetooth and USB audio, line out, HDMI. */
        val BUILTIN_SPEAKERS = setOf(AudioDeviceInfo.TYPE_BUILTIN_SPEAKER, 24 /* TYPE_BUILTIN_SPEAKER_SAFE, API 30 */)
        val EXTERNAL_OUTPUTS = setOf(
            AudioDeviceInfo.TYPE_WIRED_HEADSET,
            AudioDeviceInfo.TYPE_WIRED_HEADPHONES,
            AudioDeviceInfo.TYPE_BLUETOOTH_A2DP,
            AudioDeviceInfo.TYPE_USB_DEVICE,
            AudioDeviceInfo.TYPE_USB_ACCESSORY,
            AudioDeviceInfo.TYPE_USB_HEADSET,
            AudioDeviceInfo.TYPE_LINE_ANALOG,
            AudioDeviceInfo.TYPE_LINE_DIGITAL,
            AudioDeviceInfo.TYPE_AUX_LINE,
            AudioDeviceInfo.TYPE_HDMI,
            AudioDeviceInfo.TYPE_HEARING_AID,
            AudioDeviceInfo.TYPE_BLE_HEADSET,
            AudioDeviceInfo.TYPE_BLE_SPEAKER,
        )
    }

    /**
     * Module scripts require a JavaScript MIME type; don't rely on the platform's guess. In the Play build, index.html
     * also says so before its scripts (window.BASS_STORE), for WebViews that cannot add a script at document start.
     */
    private class MimeFixingHandler(private val inner: WebViewAssetLoader.PathHandler) : WebViewAssetLoader.PathHandler {
        override fun handle(path: String): WebResourceResponse? {
            val res = inner.handle(path) ?: return null
            if (path == "index.html" && BuildConfig.STORE.isNotEmpty()) {
                val html = res.data.use { it.readBytes().toString(Charsets.UTF_8) }
                val page = html.replaceFirst("<script type=\"module\"", "<script>window.BASS_STORE='${BuildConfig.STORE}';</script>\n  <script type=\"module\"")
                return WebResourceResponse("text/html", "utf-8", page.byteInputStream(Charsets.UTF_8))
            }
            when (path.substringAfterLast('.', "").lowercase()) {
                "js", "mjs" -> res.mimeType = "text/javascript"
                "css" -> res.mimeType = "text/css"
                "html" -> res.mimeType = "text/html"
                "svg" -> res.mimeType = "image/svg+xml"
                "json" -> res.mimeType = "application/json"
                "webmanifest" -> res.mimeType = "application/manifest+json"
            }
            return res
        }
    }
}
