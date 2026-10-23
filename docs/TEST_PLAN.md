# Validation plan

## Foundation

Validate local Markdown links and SVG XML. Inspect the brand preview in a browser. Confirm only intended files are staged and no credentials are committed. Check remote branch and local commit agree after pushing.

## Application acceptance

- Parent A cannot access Parent B's children, devices, rules, location, or media tokens by changing identifiers.
- Three children retain independent rules; one child's two devices remain separately identified.
- Pairing expiry, reuse, failed attempts, and device revocation are enforced.
- Repeated or out-of-order requests cannot duplicate approvals or regress applied rules.
- Offline devices show stale state; reconnect applies only valid rules and acknowledgements.
- Location permission denial and inaccurate/stale readings are communicated accurately.
- Guardian removal revokes application sessions and media access.
- Child can refuse/stop sharing; expired tokens cannot rejoin; screen sharing never enables touch control.
- Camera switching releases the old camera; missing cameras or permission loss stop gracefully.
- Microphone/camera OS indicators and required notifications remain visible.
- Essential contact paths remain accessible under device restrictions.

Use unit tests for deterministic rules, integration tests for authorization and persistence, browser tests for key parent flows, and real Android hardware tests for enforcement and media. No such application tests have run at the foundation stage.
