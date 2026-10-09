# P02-G: prepared institutional identity and remaining gates

This candidate extends P02-F. Maintained branches, existing databases, Neon and production deployment are unchanged. Native verification uses synthetic accounts and isolated H2 databases only.

## Identity lifecycle

1. Authenticate online against the real local auth service. Resolve the current enabled account and tenant and verify authorized history before preparing the draft.
2. Obtain a signed credential from `POST /auth/offline-access`. It binds owner, tenant, assignment, instrument version, administration UUID and device UUID. It lasts 600 seconds.
3. Use an RSA authority separate from the API bearer signing key. The backend rejects reused or weak keys. The frontend pins the public key and validates signature, issuer, audience, scope and time before opening local editing.
4. Store the credential inside the encrypted draft, never as an API bearer token. The device passphrase remains necessary to decrypt the draft after closing the page. No password or institutional bearer is persisted with the draft.
5. Reject expired credentials offline. Online recovery still requires the device passphrase and current institutional identity; renew the credential atomically before opening the draft.
6. Before sending, independently recheck live identity, assignment authorization and consent. Preserve the administration UUID, reconcile uncertain delivery and confirm through history.

This is **prepared institutional identity verification for local editing**, not a first institutional login without connectivity, an offline permission to submit, or a production-certified offline authentication system. The local device identifier binds the stored draft, but does not prove hardware possession. A copied encrypted record remains protected by its passphrase.

## Configuration and limits

The backend feature is disabled by default. The isolated runner creates an ephemeral separate RSA key; only the auth child receives the private key through its process environment. The public key is compiled into the isolated frontend using `VITE_OFFLINE_PUBLIC_KEY`. With no pinned authority, existing device-key recovery retains its local-only meaning and enrollment fails before transport.

A device clock can be changed. Immediate offline account revocation cannot be observed. Production acceptance therefore requires an agreed threat model, trusted time/rollback policy, credential lifetime and revocation policy, hardware or managed-device requirements where applicable, key custody and rotation, and review by institutional security staff. Extending the lifetime without that review is not an implementation shortcut.

## Original instruments

`requireOriginalInstrumentEvidence` adds a structural gate for Kolb, Felder/ILS and Kuder. Complete language-specific content also requires edition, publisher, form/manual SHA-256 identifiers, matching scoring-manual reference, authorization, validation population, applicability review and review reference. This gate checks declarations; it does **not** authenticate a publisher, inspect unavailable source documents or establish psychometric validity.

The available inventory CSV files are search results, not questionnaires or scoring manuals. No complete original instrument or licensed scoring algorithm has been imported. Synthetic fixtures explicitly remain synthetic.

| Family | Inputs still required for each selected ES/EN edition |
|---|---|
| Kolb | Exact edition and publisher; complete forms; application and scoring manuals for that same edition; authorized use and population review |
| Felder/ILS | Identify original ILS or named adaptation; complete matching language forms and scoring/interpretation rules; study population and equivalence evidence |
| Kuder | Identify the specific assessment and edition; complete matching language forms/manuals; norm population, authorized integration and population review |

Official acquisition/research starting points: [Felder and Soloman ILS](https://educationdesignsinc.com/index-of-learning-styles/), [ILS FAQ](https://educationdesignsinc.com/index-of-learning-styles/ils-faq/), [EBLS KELP](https://learningfromexperience.com/tools/kolb-experiential-learning-profile-kelp/), [Kuder research](https://www.kuder.com/about/research/). These pages do not constitute a complete accredited bilingual instrument package. Keep edition selection explicit; do not combine scoring from another edition or infer Colombian norms from foreign populations.

## Production validation: concrete prerequisites

Before executing a production-facing validation, record:

- Approved pilot domain and HTTPS hosting, maintained frontend/backend SHAs and deployment pipeline ownership.
- A separate Neon branch or isolated pilot database, synthetic evaluation accounts, role/tenant/consent fixtures and access policy. Supply secrets through hosting/CI secret storage, never through chat or source files.
- Database schema/migration plan, backup and rollback procedure, monitoring and retention policy.
- Institutional offline security decisions above, plus reviewed instrument publication assets if originals are in scope.
- Acceptance tests on the deployed exact SHAs: login and denied access; authorized send and history; expired session and changed account; lost acknowledgement and no duplicate UUID; offline close/reopen/edit and later authorized synchronization; ES/EN mobile/desktop; connectivity interruption.

Until these inputs and executed tests exist, production validation and school collection remain pending. The synthetic isolated test does not authorize or demonstrate school data collection.

## Verification record

Local lint, application/test types and isolated R9 types pass. Local unit suite: 432 tests in 36 files. CI must verify Java tests, compiled browser suites, actual local-auth enrollment, rejection of offline credentials as API bearers, offline expiry, online renewal and authorized UI/history on the published candidate SHAs. Record the CI outcome separately; do not treat a previous SHA's success as this candidate's evidence.
