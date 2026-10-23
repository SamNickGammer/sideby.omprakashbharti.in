# Sideby Connect — Android

Planned visible Kotlin companion for a child’s device. No Android project or installable APK exists yet. Android Studio is installed on the development machine; emulator and physical-device checks remain to be performed.

## First milestone: prove the connection

Implement pairing-code entry, device details comparison, parent approval, secure credential storage, heartbeat, reconnect and revocation. Use the existing [pairing contract](../../docs/PAIRING.md) and [acceptance path](../../docs/PARENT_WEB_READINESS.md). One child can have several devices.

This milestone does not need SMS, contacts, notification, camera, microphone or location permissions. Later capability work must be visible, permission-based and tested separately. The app must not hide or disguise itself.

The backend is Sideby Parent, not the static public website. A test phone requires a reachable configured backend; localhost on the phone is not the developer computer. Never embed parent database/provider secrets in the APK.
