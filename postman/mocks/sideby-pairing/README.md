# Android pending-state simulation

Derived from the repository's authoritative `docs/PAIRING.md`; no external team owns this API. The generated collection skeleton had no success examples, so this local handler explicitly models a pending claim and an unauthorised heartbeat. It is not an approval/backend emulator.

Run `postman simulation run postman/simulations/android-pairing.sim.yaml --port 4900 --output ndjson`. Use an adb reverse mapping from the app's port 3000 to this host port for an isolated run. Path routing uses the existing /api prefix; production requests stay unchanged. Synthetic code: `0123-4567-89AB-CDEF`. Never use a real pairing code or credential here. No cloud publication is needed.

The live local parent dashboard remains the source of end-to-end approval/revocation evidence. Keep simulation logs out of Git; they may include request bodies.
