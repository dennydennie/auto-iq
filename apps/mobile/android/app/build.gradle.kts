plugins {
    id("com.android.application")
    id("kotlin-android")
    // The Flutter Gradle Plugin must be applied after the Android and Kotlin Gradle plugins.
    id("dev.flutter.flutter-gradle-plugin")
}

val releaseTaskRequested = gradle.startParameter.taskNames.any {
    it.contains("Release", ignoreCase = true)
}
val releaseKeystorePath = providers.environmentVariable(
    "AUTO_IQ_ANDROID_KEYSTORE_PATH",
).orNull?.trim()?.takeIf { it.isNotEmpty() }
val releaseKeystorePassword = providers.environmentVariable(
    "AUTO_IQ_ANDROID_KEYSTORE_PASSWORD",
).orNull
val releaseKeyAlias = providers.environmentVariable(
    "AUTO_IQ_ANDROID_KEY_ALIAS",
).orNull
val releaseKeyPassword = providers.environmentVariable(
    "AUTO_IQ_ANDROID_KEY_PASSWORD",
).orNull
val releaseSigningValues = listOf(
    releaseKeystorePath,
    releaseKeystorePassword,
    releaseKeyAlias,
    releaseKeyPassword,
)

if (releaseTaskRequested && releaseSigningValues.any { it.isNullOrBlank() }) {
    throw GradleException(
        "Release signing requires the AUTO_IQ_ANDROID_KEYSTORE_PATH, " +
            "AUTO_IQ_ANDROID_KEYSTORE_PASSWORD, AUTO_IQ_ANDROID_KEY_ALIAS, " +
            "and AUTO_IQ_ANDROID_KEY_PASSWORD environment variables.",
    )
}

android {
    namespace = "zw.co.bisell.autoiq.mobile"
    compileSdk = flutter.compileSdkVersion
    ndkVersion = flutter.ndkVersion

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = JavaVersion.VERSION_17.toString()
    }

    defaultConfig {
        applicationId = "zw.co.bisell.autoiq.mobile"
        minSdk = flutter.minSdkVersion
        targetSdk = flutter.targetSdkVersion
        versionCode = flutter.versionCode
        versionName = flutter.versionName
    }

    signingConfigs {
        if (releaseSigningValues.all { !it.isNullOrBlank() }) {
            create("release") {
                storeFile = file(releaseKeystorePath!!)
                storePassword = releaseKeystorePassword
                keyAlias = releaseKeyAlias
                keyPassword = releaseKeyPassword
            }
        }
    }

    buildTypes {
        release {
            signingConfig = signingConfigs.findByName("release")
        }
    }
}

flutter {
    source = "../.."
}
