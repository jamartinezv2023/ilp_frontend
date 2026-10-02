const ADAPTIVE_API_ENV_NAME = "VITE_ADAPTIVE_API_BASE_URL";
const AUTH_API_ENV_NAME = "VITE_AUTH_API_BASE_URL";

function requireAbsoluteHttpUrl(value: string | undefined, name: string): string {
  const candidate = value?.trim();

  if (!candidate) {
    throw new Error(`${name} is required and must be an absolute HTTP(S) URL.`);
  }

  let parsed: URL;
  try {
    parsed = new URL(candidate);
  } catch {
    throw new Error(`${name} must be an absolute HTTP(S) URL.`);
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error(`${name} must use the http or https protocol.`);
  }

  if (parsed.username || parsed.password || parsed.search || parsed.hash) {
    throw new Error(`${name} must not contain credentials, a query, or a fragment.`);
  }

  return parsed.toString().replace(/\/$/, "");
}

export const ADAPTIVE_API_BASE_URL = requireAbsoluteHttpUrl(
  import.meta.env.VITE_ADAPTIVE_API_BASE_URL,
  ADAPTIVE_API_ENV_NAME,
);

export const AUTH_API_BASE_URL = requireAbsoluteHttpUrl(
  import.meta.env.VITE_AUTH_API_BASE_URL,
  AUTH_API_ENV_NAME,
);

const tenantCandidate = import.meta.env.VITE_TENANT_ID?.trim();
if (!tenantCandidate || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(tenantCandidate)) {
  throw new Error("VITE_TENANT_ID is required and must be a canonical UUID.");
}

export const TENANT_ID = tenantCandidate;

// Compatibility alias for existing consumers of the central configuration.
export const API_BASE_URL = ADAPTIVE_API_BASE_URL;
