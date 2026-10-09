# P02-F — encrypted synthetic drafts and explicit recovery

## Scope and preserved baseline

This increment belongs to the draft frontend PR #39 and isolated R9 runtime. It does not merge maintained branches, deploy, connect to Neon, change existing H2 files, or enable school collection. Backend runtime remains pinned to `79b385a11cecaa75dcec5658e96a1e9b3e43a878`.

P02-E encrypted only the scope binding; answers remained in the legacy IndexedDB record. P02-F encrypts the complete prepared synthetic draft (scope, attempt ID, answer, revision and timestamps). Unprepared P02 drafts remain in the existing plaintext store. This is not a claim of platform-wide encryption or offline institutional authentication.

## Acceptance criteria

- Online verified identity and an authorized history read precede preparation.
- Native PBKDF2/SHA-256 (600,000 iterations, random 16-byte salt) derives a nonextractable AES-GCM-256 key from a separate 12–128 character device key. Every encryption uses a fresh random 12-byte IV and fixture-bound authenticated data.
- The cipher envelope contains schema, salt, IV and ciphertext only. The complete draft is encrypted; the device key and bearer token are never written to storage.
- One strict IndexedDB transaction validates the current plaintext source, inserts ciphertext and deletes that source. Failure rolls back both operations. Existing encrypted drafts are never silently overwritten.
- Encrypted edits compare the authenticated revision and compare-and-swap the exact previous envelope in a transaction. Conflicting writers fail without replacing the committed revision.
- Unlocking creates an in-memory capability. Cloned draft objects, locked capabilities, wrong keys, malformed envelopes, tampering and ciphertext copied to another fixture fail closed.
- Reloading or ending a session removes access to the in-memory capability. Recovery requires the device key even after an online login. Online recovery also compares the decrypted scope with the current verified institutional identity before showing answers.
- Authorized synchronization reads the current encrypted draft through the unlocked capability. It never reconstructs a plaintext IndexedDB record. Existing authorization, consent, attempt UUID, uncertain-delivery reconciliation and history confirmation rules remain in force.
- Confirmation retains ciphertext for recovery and subsequent history reconciliation. It does not erase the draft or device key recovery requirement.

## Migration and recovery limits

Old scope-only localStorage bindings are removed after the full draft migration commits. Their plaintext source remains recoverable online until migration is explicitly requested. If a migration fails, no success is reported and the source remains intact.

For a migrated draft there is no institutional-password fallback, key reset or escrow. Losing the device key means this test cannot recover the encrypted answers. Preserve the ciphertext; do not erase it as an automatic error recovery action. The bilingual interface states this limitation.

There is no trusted offline expiry, offline revocation check, defense against compromised same-origin scripts or an unlocked shared browser profile. Storage deletion or browser eviction can lose drafts. A device key unlocks local data; it grants no server permission. Production identity, recovery, retention, revocation and shared-device policies remain separate requirements.

## Verification

Unit tests inspect persistent envelopes and absence of the legacy record, verify wrong-key and tamper rejection, migration rollback, encrypted-write failure preservation, capability locking, competing revisions and stable attempt identity. Default unit fetch rejects unmocked network requests.

Native R9 browser tests cover ES/EN at 360 and 1440 px: prepare, close/reopen offline, wrong-key rejection, recover/edit/reload/recover, inspect ciphertext-only IndexedDB records, reconnect, real online login plus device-key recovery, deny another account, lose a real submission acknowledgement, confirm one attempt through authorized history, repeat reconciliation without another POST, and reject withdrawn consent. The browser result must be checked on the published frontend SHA; unit success alone does not approve integration.

Original Kolb, Felder–Soloman ILS and Kuder editions, manuals, psychometric applicability, production validation and school collection remain pending.
