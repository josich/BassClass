package com.bassclass.app

import android.Manifest
import android.annotation.SuppressLint
import android.app.Activity
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import android.view.View
import android.view.WindowInsets
import android.view.WindowInsetsController
import android.view.WindowManager
import android.webkit.PermissionRequest
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.webkit.WebViewAssetLoader

/**
 * Hosts the BassClass web app (packaged from ../../web as assets) in a
 * full-screen landscape WebView. Assets are served from a virtual https
 * origin so ES modules, localStorage and Web Audio behave as on the web.
 */
class MainActivity : Activity() {

    private lateinit var web: WebView
    private var pendingMic: PermissionRequest? = null

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
            setBackgroundColor(0xFF12142A.toInt())
            webViewClient = object : WebViewClient() {
                override fun shouldInterceptRequest(view: WebView, request: WebResourceRequest): WebResourceResponse? =
                    loader.shouldInterceptRequest(request.url)
            }
            // the tuner asks for the microphone: forward it to Android's permission dialog
            webChromeClient = object : WebChromeClient() {
                override fun onPermissionRequest(request: PermissionRequest) {
                    runOnUiThread {
                        if (!request.resources.contains(PermissionRequest.RESOURCE_AUDIO_CAPTURE)) {
                            request.deny()
                        } else if (checkSelfPermission(Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED) {
                            request.grant(arrayOf(PermissionRequest.RESOURCE_AUDIO_CAPTURE))
                        } else {
                            pendingMic = request
                            requestPermissions(arrayOf(Manifest.permission.RECORD_AUDIO), REQ_MIC)
                        }
                    }
                }
            }
        }
        setContentView(web)
        hideSystemBars()

        if (savedInstanceState != null) web.restoreState(savedInstanceState)
        else web.loadUrl("https://appassets.androidplatform.net/assets/index.html")
    }

    override fun onRequestPermissionsResult(requestCode: Int, permissions: Array<out String>, grantResults: IntArray) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        if (requestCode != REQ_MIC) return
        val req = pendingMic ?: return
        pendingMic = null
        if (grantResults.firstOrNull() == PackageManager.PERMISSION_GRANTED) req.grant(arrayOf(PermissionRequest.RESOURCE_AUDIO_CAPTURE))
        else req.deny()
    }

    override fun onWindowFocusChanged(hasFocus: Boolean) {
        super.onWindowFocusChanged(hasFocus)
        if (hasFocus) hideSystemBars()
    }

    override fun onSaveInstanceState(outState: Bundle) {
        super.onSaveInstanceState(outState)
        web.saveState(outState)
    }

    @Deprecated("Back is routed to the web app's history")
    override fun onBackPressed() {
        if (web.canGoBack()) web.goBack() else @Suppress("DEPRECATION") super.onBackPressed()
    }

    override fun onPause() {
        web.onPause()
        super.onPause()
    }

    override fun onResume() {
        super.onResume()
        web.onResume()
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
        const val REQ_MIC = 7
    }

    /** Module scripts require a JavaScript MIME type; don't rely on the platform's guess. */
    private class MimeFixingHandler(private val inner: WebViewAssetLoader.PathHandler) : WebViewAssetLoader.PathHandler {
        override fun handle(path: String): WebResourceResponse? {
            val res = inner.handle(path) ?: return null
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
