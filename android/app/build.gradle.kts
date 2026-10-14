plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "com.bassclass.app"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.bassclass.app"
        minSdk = 24
        targetSdk = 35
        versionCode = 1
        versionName = "1.0"
    }

    buildTypes {
        release {
            isMinifyEnabled = false
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
}

dependencies {
    implementation("androidx.webkit:webkit:1.12.1")
}
