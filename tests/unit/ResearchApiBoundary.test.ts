import { beforeEach, expect, it, vi } from 'vitest';
const http = vi.hoisted(() => ({ get: vi.fn() }));
vi.mock('axios', () => ({ default: { create: () => http, isAxiosError: (error: unknown) => Boolean((error as { isAxiosError?: boolean })?.isAxiosError) } }));
import { fetchResearchSignals } from '../../src/services/researchApi';
beforeEach(() => { http.get.mockReset(); });
it('preserves structured API evidence and separates status from personal text', async () => {
 const payload = { governanceLevel: 'HIGH', protectedEducationalPrinciples: ['Synthetic evidence'], nested: { id: 'KEEP' }, count: 2 };
 http.get.mockResolvedValue({ data: payload });
 const result = await fetchResearchSignals();
 expect(result).toHaveLength(8);
 expect(result[0].payload).toBe(payload);
 expect(result[0].status).toBe('HIGH');
 expect(result[0].evidence).toEqual(['Synthetic evidence']);
 expect(JSON.stringify(payload)).toContain('KEEP');
});
it.each([null, [], {}, 'invalid'])('reports malformed research data as unavailable: %j', async data => {
 http.get.mockResolvedValue({ data });
 const result = await fetchResearchSignals();
 expect(result.every(signal => signal.status === 'NO DISPONIBLE' && !signal.payload)).toBe(true);
});
it('retains healthy signals when another endpoint fails and never invents evidence', async () => {
 http.get.mockRejectedValueOnce({ isAxiosError: true, response: { status: 403 } }).mockResolvedValue({ data: { ethicsReadiness: false, count: 0 } });
 const result = await fetchResearchSignals();
 expect(result[0].summary).toContain('403');
 expect(result[0].evidence).toEqual(['No se sustituyó la respuesta por datos estáticos ni de demostración.']);
 expect(result[1].payload).toEqual({ ethicsReadiness: false, count: 0 });
 expect(result[1].status).toBe('false');
});
it('reports network failure without replacing it with demonstration content', async () => {
 http.get.mockRejectedValue({ isAxiosError: true, request: {} });
 expect((await fetchResearchSignals()).every(signal => signal.summary.includes('No fue posible establecer comunicación'))).toBe(true);
});
