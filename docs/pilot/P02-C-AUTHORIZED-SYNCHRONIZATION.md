# P02-C: online identity and authorized synthetic synchronization

## Candidate scope

This extends the isolated R9 laboratory only. The maintained application and the P02-B offline-reopening laboratory retain their existing entry points. R9 uses live auth/adaptive services and isolated in-memory H2 databases. Every person, question and answer in this laboratory is synthetic.

GET `/auth/session-identity` verifies the signed JWT through the existing resource server, request tenant, stable subject UUID and current enabled account. It returns UUIDs, uses `Cache-Control: no-store`, and does not grant permission to submit an assessment.

Drafts are partitioned by that verified user, institution, assignment and instrument edition. The IndexedDB record contains synthetic answers and metadata; it contains no bearer token, refresh token, password or cookie.

## Transaction sequence

1. Log in online and retrieve a verified identity before loading a draft.
2. Select a response and save explicitly. `Saved on this device` means the IndexedDB transaction committed; it does not mean server registration.
3. Continue saving in the already open, prepared R9 page while disconnected. Closing a session preserves its draft. R9 reopening requires connectivity and a new login; offline reopening of the separate P02-B laboratory remains a different verified capability.
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

Offline authentication, a cached authenticated R9 shell, automatic background synchronization, full-suite offline operation, production persistence, remote deployment and real instruments are not established by this increment. Access to browser storage is not cryptographic protection from someone using the same browser profile. No school data may be inferred from this synthetic test.

CI pins the backend candidate SHA. Approvals refer only to the exact tested commits; this document does not claim CI/Sonar success before those checks complete. Both candidates remain draft pull requests and no merge, migration, remote database operation or manual deployment is included.
