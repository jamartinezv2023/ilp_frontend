import { describe, it, expect, vi } from 'vitest';
import { authorizedScientificApi, type AuthorizedSnapshot } from '../../src/features/assessment-engine/services/authorizedScientificApi';
const assignment = '22222222-2222-4222-8222-222222222222';
const institution = '11111111-1111-4111-8111-111111111111';
const observation = { administrationId: 'admin/1', assessmentCode: 'SYNTHETIC',
  assessmentVersion: 'TEST_V1', submittedAt: '2026-10-04T00:00:00Z',
  scores: [{ dimensionCode: 'CE', numericValue: 4 }] };
async function fixture(): Promise<AuthorizedSnapshot> {
  const csv = 'subject,score\nSYNTHETIC-001,4\n';
  const bytes = new TextEncoder().encode(csv);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return { csv, manifest: { assignmentId: assignment, institutionId: institution,
    administrationId: observation.administrationId, researchSubjectId: 'SYNTHETIC-001',
    instrumentCode: observation.assessmentCode, instrumentVersion: observation.assessmentVersion,
    consentEvidenceId: 'evidence', consentDocumentSha256: 'document-hash', consentVersion: 'TEST_ONLY',
    scores: observation.scores, sha256: Array.from(new Uint8Array(digest), v => v.toString(16).padStart(2, '0')).join(''),
    bytes: bytes.length, rowCount: 1, schemaVersion: 'ILP_AUTHORIZED_ANSWERS_CSV_V1' } };
}
function respond(data: unknown, status = 200) {
  const fetchMock = vi.fn().mockResolvedValue(new Response(status === 204 ? null : JSON.stringify(data), { status }));
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}
describe('authorized scientific transport and integrity', () => {
  it('sends authenticated institution context without cookies or cache', async () => {
    const fetchMock = respond([observation]);
    expect(await authorizedScientificApi('synthetic-token').history(assignment.toUpperCase())).toEqual([observation]);
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining(`${assignment}/history`), {
      method: 'GET', credentials: 'omit', cache: 'no-store',
      headers: { Authorization: 'Bearer synthetic-token', 'X-Tenant-Id': institution },
    });
  });
  it('rejects an invalid assignment before requesting', () => {
    const fetchMock = respond([]);
    expect(() => authorizedScientificApi('token').history('../other-institution')).toThrow('INVALID_IDENTIFIER');
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it.each([401, 403, 404, 409, 500])('propagates HTTP %s without fabricated history', async status => {
    respond({}, status);
    await expect(authorizedScientificApi('token').history(assignment)).rejects.toThrow(`HTTP_${status}`);
  });
  it('withdraws once using POST and accepts 204', async () => {
    const fetchMock = respond(null, 204);
    await expect(authorizedScientificApi('token').withdraw(assignment)).resolves.toBeUndefined();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining(`/consents/${assignment}/withdraw`), expect.objectContaining({ method: 'POST' }));
    expect(() => authorizedScientificApi('token').withdraw('bad')).toThrow('INVALID_IDENTIFIER');
  });
  it('verifies real SHA-256, bytes, schema, identity, version and scores', async () => {
    const snapshot = await fixture(); const fetchMock = respond(snapshot);
    expect(await authorizedScientificApi('token').snapshot(assignment.toUpperCase(), observation)).toEqual(snapshot);
    expect(fetchMock.mock.calls[0][0]).toContain('admin%2F1/snapshot');
  });
  it.each(['sha256', 'bytes', 'schemaVersion', 'assignmentId', 'institutionId', 'administrationId', 'instrumentCode', 'instrumentVersion', 'scores'] as const)(
    'blocks a mismatched %s', async field => {
      const snapshot = await fixture();
      const manifest = { ...snapshot.manifest, [field]: field === 'bytes' ? 0 : field === 'scores' ? [] : 'corrupt' };
      respond({ ...snapshot, manifest });
      await expect(authorizedScientificApi('token').snapshot(assignment, observation)).rejects.toThrow('SNAPSHOT_INTEGRITY_FAILED');
    });
  it('blocks CSV corruption with unchanged manifest', async () => {
    const snapshot = await fixture(); respond({ ...snapshot, csv: snapshot.csv + 'tampered' });
    await expect(authorizedScientificApi('token').snapshot(assignment, observation)).rejects.toThrow('SNAPSHOT_INTEGRITY_FAILED');
  });
});
