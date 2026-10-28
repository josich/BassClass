plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

// Every CI build gets a higher version so Android installs it as an update.
val buildNumber = (System.getenv("GITHUB_RUN_NUMBER") ?: "1").toInt()

// One permanent signing key (created by the first CI build and committed), so
// updates install over the previous version and keep the app's saved progress.
// It signs the GitHub test builds only: it is public, so never the Play build.
val signingKey = file("bassclass.p12")

// The Play build's upload key (LAUNCH-TODO.md): never in git. CI writes it from the repository's secrets and passes
// these four variables; without them the Play bundle is built unsigned (a check that it builds), never with our key.
val uploadKeystore = System.getenv("UPLOAD_KEYSTORE")?.let { file(it) }?.takeIf { it.exists() }

android {
    namespace = "com.bassclass.app"
    compileSdk = 36

    defaultConfig {
        applicationId = "com.bassclass.app"
        minSdk = 24
        // Android 16 (API 36): Google Play's target for new apps and updates from Aug 31, 2026
        targetSdk = 36
        versionCode = buildNumber
        versionName = "1.0.$buildNumber"
    }

    buildFeatures {
        buildConfig = true
    }

    signingConfigs {
        create("bassclass") {
            storeFile = signingKey
            storeType = "pkcs12"
            storePassword = "bassclass"
            keyAlias = "bassclass"
            keyPassword = "bassclass"
        }
        if (uploadKeystore != null) {
            create("upload") {
                storeFile = uploadKeystore
                storeType = "pkcs12"
                storePassword = System.getenv("UPLOAD_STORE_PASSWORD")
                keyAlias = System.getenv("UPLOAD_KEY_ALIAS")
                keyPassword = System.getenv("UPLOAD_KEY_PASSWORD")
            }
        }
    }

    // Two builds of one app (launch review, 2026-10-28): `github`, the test APK published on GitHub (the Pro gates
    // off, signed with the committed key), and `play`, the App Bundle for Google Play (BuildConfig.STORE = "play": the
    // gates on, Google Play Billing, signed with the upload key). The signing is set per flavour: a build type's
    // signing config would win over the flavour's.
    flavorDimensions += "store"
    productFlavors {
        create("github") {
            dimension = "store"
            buildConfigField("String", "STORE", "\"\"")
            if (signingKey.exists()) signingConfig = signingConfigs.getByName("bassclass")
        }
        create("play") {
            dimension = "store"
            buildConfigField("String", "STORE", "\"play\"")
            if (uploadKeystore != null) signingConfig = signingConfigs.getByName("upload")
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = false
        }
        debug {
            if (signingKey.exists()) signingConfig = signingConfigs.getByName("bassclass")
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions {
        jvmTarget = "17"
    }

    // The whole app is the web build in ../../web, packaged as APK assets.
    sourceSets {
        getByName("main") {
            assets.srcDirs("../../web")
        }
    }
    // (the drums and the piano are in too since 2026-10-27, about 3.5 MB: the app needs no connection and nothing
    // from the repository.) Android's default list, which leaves out folders starting with "_", such as web/_raw.
    androidResources {
        ignoreAssetsPattern = "!.svn:!.git:!.ds_store:!*.scc:.*:<dir>_*:!CVS:!thumbs.db:!picasa.ini:!*~"
    }
}

dependencies {
    implementation("androidx.webkit:webkit:1.12.1")
    // Google Play's in-app review card for the rate reminder (user, 2026-10-28: "add the in-app review card")
    implementation("com.google.android.play:review:2.0.2")
    // Google Play Billing, the Play build only (BassClass Pro and the tips; Play asks for version 8 or later since
    // 31 Aug 2026): src/play/java/com/bassclass/app/StoreBridge.kt
    "playImplementation"("com.android.billingclient:billing:9.1.0")
}
