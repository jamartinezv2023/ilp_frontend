# P02-C: online identity and authorized synthetic synchronization

## Candidate scope

This extends the isolated R9 laboratory only. The maintained application and the P02-B offline-reopening laboratory retain their existing entry points. R9 uses live auth/adaptive services and isolated in-memory H2 databases. Every person, question and answer in this laboratory is synthetic.

The real-service test exposed a duplicate legacy servlet filter expecting `tenant_id` while the current JWT uses `tenantId`. Its component registration is retired; the existing `TenantValidationFilter` in the security chain remains responsible for tenant validation. No tenant check is bypassed.

GET `/auth/session-identity` verifies the signed JWT through the existing resource server, request tenant, stable subject UUID and current enabled account. It returns UUIDs, uses `Cache-Control: no-store`, and does not grant permission to submit an assessment.

Drafts are partitioned by that verified user, institution, assignment and instrument edition. The IndexedDB record contains synthetic answers and metadata; it contains no bearer token, refresh token, password or cookie.

## Transaction sequence

1. Log in online and retrieve a verified identity before loading a draft.
2. Select a response and save explicitly. `Saved on this device` means the IndexedDB transaction committed; it does not mean server registration.
3. Continue saving in the already open, prepared R9 page while disconnected. Closing a session preserves its draft. After explicit preparation, R9 can reopen its public shell offline, but it remains locked: no login form, identity, draft or server history is exposed. Reconnect and authenticate online to recover the draft. This is not offline authentication. Offline reopening of the separate P02-B laboratory remains a different capability.
4. Reconnect, log in and recover the same draft under the same verified account and context.
5. Synchronization obtains a cross-tab Web Lock, rechecks online identity, then reads the authorized history. A denied or failed history read blocks POST.
6. If the original administration ID exists, verify its instrument, consent and exact synthetic answer in the integrity-checked authorized snapshot. Never resend that existing attempt.
7. Otherwise ensure the stored revision still matches, then send the original administration ID exactly once in that invocation. The server checks scientific grant, tenant, consent and instrument permission.
8. A lost acknowledgement, 409 or server error triggers history reconciliation, not an automatic second POST. Only matching history plus snapshot can produce server confirmation. An unconfirmed result retains the local draft and ID for a later explicit retry.

A Web Lock prevents concurrent synchronization in supported browsers; if it is unavailable the client refuses synchronization. The backend's existing administration uniqueness boundary additionally rejects duplicate registration with 409. No new idempotency endpoint or persistent production database is introduced.

## Evidence to collect

- Java controller identity tests and existing login regressions.
- Client tests for invalid/mismatched identity, failed preflight, rejected submission, lost acknowledgement, conflict reconciliation, changed revision, mismatched snapshot and cancellation.
- Ten real-service Chromium cases: six R9 regression cases plus four offline draft / reauthorization / lost acknowledgement / reload reconciliation cases in ES/EN at 360 and 1440 pixels.
- Each new case requires zero POST while saving offline or under another account, exactly one accepted POST despite a lost acknowledgement and repeat confirmation, one matching history row, and preservation of the draft after consent withdrawal.

## Remaining work

Offline authentication, an authenticated offline R9 shell, automatic background synchronization, full-suite offline operation, production persistence, remote deployment and real instruments are not established by this increment. Access to browser storage is not cryptographic protection from someone using the same browser profile. No school data may be inferred from this synthetic test.

CI pins the backend candidate SHA. Approvals refer only to the exact tested commits; this document does not claim CI/Sonar success before those checks complete. Both candidates remain draft pull requests and no merge, migration, remote database operation or manual deployment is included.

## P02-D: locked offline reopening

The explicit preparation action registers a worker scoped to `/r9.html`, verifies that every compiled public asset is cached, and reports readiness only after that verification. The cache is versioned by worker, asset manifest and emitted HTML. Installation failure deletes the incomplete cache. Activation removes only older `ilp-r9-shell-` caches, leaving the separate P02 laboratory and other site caches untouched.

The worker serves only allowlisted GET requests to `/r9.html` and generated `/assets/` resources on the same origin, with no Authorization or tenant header. It never caches login, identity, fixture, history, snapshot, POST, tokens or API errors. Synthetic drafts continue using the existing partitioned IndexedDB store; cache storage contains public application code only.

The four ES/EN mobile/desktop draft cases additionally open a new page while offline, require the locked screen with no authenticated assessment, login form or draft identifiers, inspect the cache allowlist, then reconnect and require a new real login before recovering the original administration UUID and answer. Returning connectivity alone cannot authenticate the user. The browser storage limitations above still apply; this is not cryptographic storage protection or a production offline identity mechanism.
