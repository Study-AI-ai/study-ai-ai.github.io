# StudyAI Android app

This folder contains the separate Capacitor project used to package the existing StudyAI website as an installable Android app.

## How it works

- The app opens from its own Android launcher icon; it does not need Chrome to launch.
- The web interface is bundled inside the APK using the current root `index.html` and its local image assets.
- AI Tutor, Supabase sign-in, Community, account sync, subscription checks and other remote services still need an internet connection.
- Only locally bundled pages and content already saved on the device can be used offline.
- The Android project is generated in GitHub Actions so the existing backend `package.json` and website hosting structure stay separate.

## Build

The workflow `.github/workflows/android-apk.yml` builds a debug APK automatically when the Android project or bundled website source changes. It also supports manual runs from the Actions tab.

The resulting APK is named `StudyAI.apk` and is published as a GitHub release asset.

## Important signing note

The first CI APK is debug-signed for device testing. Do not treat it as a Play Store release. A production release needs a private, stable Android signing key stored as GitHub Actions secrets; never commit a keystore or signing password into this public repository. Until stable signing is configured, a future test APK may require uninstalling the previous test build before installing the new one.

## Requirements

- Capacitor 8.6.0
- Node.js 22+
- Android SDK and Java 21 in CI
- Android 8.0+ (API 26+) device
