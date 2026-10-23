plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

// Every CI build gets a higher version so Android installs it as an update.
val buildNumber = (System.getenv("GITHUB_RUN_NUMBER") ?: "1").toInt()

// One permanent signing key (created by the first CI build and committed), so
// updates install over the previous version and keep the app's saved progress.
val signingKey = file("bassclass.p12")

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

    signingConfigs {
        create("bassclass") {
            storeFile = signingKey
            storeType = "pkcs12"
            storePassword = "bassclass"
            keyAlias = "bassclass"
            keyPassword = "bassclass"
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            if (signingKey.exists()) signingConfig = signingConfigs.getByName("bassclass")
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
    // ... except the Practice room's drum samples: the app fetches them online on first use and keeps
    // them in its cache (web/js/drums.js). The rest is Android's default list (it already leaves out
    // folders starting with "_", such as web/_raw).
    androidResources {
        ignoreAssetsPattern = "!.svn:!.git:!.ds_store:!*.scc:.*:<dir>_*:!CVS:!thumbs.db:!picasa.ini:!*~:<dir>drums"
    }
}

dependencies {
    implementation("androidx.webkit:webkit:1.12.1")
}
