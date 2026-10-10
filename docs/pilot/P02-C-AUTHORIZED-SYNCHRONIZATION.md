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

## P02-E: prepared local unlocking and offline editing

After a real online login, an enabled account identity, successful current authorized history query and a committed unsubmitted synthetic draft, the user can explicitly prepare a separate device key of 12–128 characters. The preparation also verifies the public shell cache. An existing prepared key is never overwritten silently. Already recorded attempts cannot be prepared.

PBKDF2-SHA256 with 600,000 iterations derives a nonextractable AES-256-GCM key using a fresh 16-byte salt and 12-byte IV. Only the scope binding and original administration UUID are sealed; the fixture storage key is authenticated additional data. Neither the passphrase, derived key, bearer token nor account password is stored. After reload, the offline screen remains locked until that separate device key successfully decrypts the binding. A wrong key, tampered ciphertext or a binding copied to a different fixture fails closed. Unsupported Web Crypto or Web Locks do not receive a weaker preparation fallback.

The editor recovers the latest local synthetic draft, changes A/B with revision conflict protection, and preserves the administration UUID. It offers no submission or history action. Locking or reloading clears the open editor; reconnection unmounts it and requires an online account login. Online synchronization still verifies identity, authorization, consent, edition and matching history/snapshot. Server confirmation removes the prepared local binding without deleting the durable draft used for reconciliation.

### Explicit limits

This is local knowledge-factor unlocking of a prepared synthetic context, **not fresh institutional authentication while offline** and not proof that server authorization remains active during a disconnection. There is no offline revocation check, trusted expiry policy, browser-profile isolation, XSS resistance or cryptographic protection of all answers. In particular, the previous synthetic IndexedDB draft store remains plaintext. Sealing the binding does not encrypt that existing store. The prepared binding currently requires explicit browser storage removal followed by a new online preparation to reset a forgotten device key; online account recovery of the draft remains possible without it. Background synchronization and institutional offline authentication remain separate requirements. Real school data must not be used in this laboratory.

Browser acceptance extends the four offline ES/EN mobile/desktop cases: wrong-key denial, correct local unlocking, editing, saving, reloading offline, renewed unlocking and recovery of the changed answer with the same attempt UUID, zero submission while disconnected, then fresh real login and authorized synchronization/history without duplicate registration.

Implementation references: [Web Crypto key derivation](https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/deriveKey) and [AES-GCM decryption](https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/decrypt). These describe API semantics; they do not certify this laboratory for production use.
