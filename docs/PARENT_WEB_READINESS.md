# Parent web readiness

Reviewed 24 October 2026. The parent web foundation is ready to serve as the integration target for the first Android pairing test. It is not ready for an unrestricted public parental-control launch.

## Ready for companion integration

- Accounts and server-verified sessions; family ownership isolation.
- Multiple children and multiple device records per child.
- Short-lived pairing code, claim, parent comparison/confirmation, approval, check-in and revocation lifecycle.
- Device credentials are scoped to heartbeat and cannot read family data.
- Clear pending/offline states and unavailable device-content/media views.
- Responsive dashboard, direct child routes, SMS/social filters and permission explanations.
- App README, API/pairing contracts, migration guidance and recorded verification.

## First Android acceptance path

1. Install the visible Sideby Connect app on an emulator or test phone.
2. Parent creates a pairing code for a synthetic child.
3. Companion claims the code; parent compares details and approves.
4. Companion stores the returned credential securely, sends heartbeat, and parent sees updated check-in status.
5. Restart the companion and check reconnection. Test expired/reused codes, offline recovery and revoked credentials.
6. Confirm that another family's account cannot access the device.

Use a reachable HTTPS parent backend for physical phones, or an explicitly configured development host for the emulator. `127.0.0.1` on a phone points to that phone, not the development computer. Never disable certificate validation to make pairing work. The landing website is not the pairing backend.

No contacts, SMS, notification, media, location or screen-capture permissions are necessary to prove connection. Introduce those only in separately scoped, disclosed and validated milestones.

## Outstanding public-app launch gates

Recovery email/reset verification; account deletion and retention; production edge rate limits; backup/restore and operational monitoring; credential rotation; deployment origin/trusted-domain verification; accessibility/device-matrix checks and security review. Co-parent access and all Android monitoring/control capabilities remain outside this completed web foundation.

See [verification](VERIFICATION.md), [pairing](PAIRING.md), [security](SECURITY.md) and [deployment](DEPLOYMENT.md). A passing web build does not establish Android compatibility or production readiness.
