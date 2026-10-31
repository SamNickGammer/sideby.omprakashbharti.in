plugins { id("com.android.application") }
android {
    namespace = "in.omprakashbharti.sideby.connect"
    compileSdk = 37
    defaultConfig {
        applicationId = "in.omprakashbharti.sideby.connect"
        minSdk = 26
        targetSdk = 37
        versionCode = 6
        versionName = "0.5.0"
    }
    buildFeatures { buildConfig = true }
    buildTypes { getByName("debug") { applicationIdSuffix = ".debug"; versionNameSuffix = "-debug" } }
    compileOptions { sourceCompatibility = JavaVersion.VERSION_17; targetCompatibility = JavaVersion.VERSION_17 }
}
dependencies {
    implementation("io.livekit:livekit-android:2.29.2")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.10.2")
 testImplementation("junit:junit:4.13.2") }
