import { afterEach, describe, it, expect, vi } from 'vitest';
afterEach(()=>{vi.unstubAllEnvs();vi.resetModules();});
describe('fail-closed API configuration',()=>{
 it.each(['', 'relative/path','ftp://example.test','https://user:password@example.test','https://example.test/?query=1','https://example.test/#fragment'])('rejects invalid adaptive URL %s',async url=>{
  vi.resetModules();vi.stubEnv('VITE_ADAPTIVE_API_BASE_URL',url);
  await expect(import('../../src/config/apiConfig')).rejects.toThrow('VITE_ADAPTIVE_API_BASE_URL');
 });
 it.each(['','not-a-uuid','11111111-1111-0111-1111-111111111111'])('rejects invalid institution %s',async tenant=>{
  vi.resetModules();vi.stubEnv('VITE_TENANT_ID',tenant);
  await expect(import('../../src/config/apiConfig')).rejects.toThrow('VITE_TENANT_ID');
 });
 it('normalizes an absolute URL and rejects missing auth configuration',async()=>{
  vi.resetModules();vi.stubEnv('VITE_ADAPTIVE_API_BASE_URL',' https://adaptive.example.test/ ');
  const config=await import('../../src/config/apiConfig');expect(config.ADAPTIVE_API_BASE_URL).toBe('https://adaptive.example.test');expect(config.API_BASE_URL).toBe(config.ADAPTIVE_API_BASE_URL);
  vi.resetModules();vi.stubEnv('VITE_AUTH_API_BASE_URL','');await expect(import('../../src/config/apiConfig')).rejects.toThrow('VITE_AUTH_API_BASE_URL');
 });
});
