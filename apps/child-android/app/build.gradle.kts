plugins { id("com.android.application") }
android {
    namespace = "in.omprakashbharti.sideby.connect"
    compileSdk = 37
    defaultConfig {
        applicationId = "in.omprakashbharti.sideby.connect"
        minSdk = 26
        targetSdk = 37
        versionCode = 4
        versionName = "0.3.0"
    }
    buildFeatures { buildConfig = true }
    buildTypes { getByName("debug") { applicationIdSuffix = ".debug"; versionNameSuffix = "-debug" } }
    compileOptions { sourceCompatibility = JavaVersion.VERSION_17; targetCompatibility = JavaVersion.VERSION_17 }
}
dependencies { testImplementation("junit:junit:4.13.2") }
