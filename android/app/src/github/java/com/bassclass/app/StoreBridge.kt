package com.bassclass.app

import android.app.Activity

/**
 * The GitHub test build sells nothing: its bridge has no billing methods, so web/js/billing.js finds none and the Pro
 * gates stay off (web/js/pro.js). The Play build's own StoreBridge (src/play) holds Google Play Billing.
 */
@Suppress("UNUSED_PARAMETER")
open class StoreBridge(activity: Activity, send: (String) -> Unit) {
    /** The app came back to the front. */
    fun storeResume() {}

    /** The app is closing. */
    fun storeDestroy() {}
}
