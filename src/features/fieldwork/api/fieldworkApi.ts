const API_BASE_URL =
  import.meta.env.VITE_ADAPTIVE_API_BASE_URL ??
  "https://ilp-adaptive-education-service.onrender.com";

type JsonRecord = Record<string, unknown>;

const parseJsonResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const message = await response.text();
    throw new Error(
      message || `Error HTTP ${response.status}: ${response.statusText}`
    );
  }

  return response.json() as Promise<T>;
};

export const registerConsent = async (
  payload: JsonRecord
): Promise<JsonRecord> => {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/fieldwork/consents`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    }
  );

  return parseJsonResponse<JsonRecord>(response);
};

export const createParticipant = async (
  payload: JsonRecord
): Promise<JsonRecord> => {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/fieldwork/participants`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    }
  );

  return parseJsonResponse<JsonRecord>(response);
};

export const fetchFieldworkReadiness = async (): Promise<JsonRecord> => {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/fieldwork/readiness`,
    {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    }
  );

  return parseJsonResponse<JsonRecord>(response);
};