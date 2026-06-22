const API_BASE_URL =
  import.meta.env.VITE_ADAPTIVE_API_BASE_URL ?? "http://localhost:8085";

export async function registerConsent(payload: {
  participantCode: string;
  consentType: string;
  status: string;
}) {
  const response = await fetch(`${API_BASE_URL}/api/v1/fieldwork/consents`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error("No se pudo registrar el consentimiento");
  }

  return response.json();
}

export async function createParticipant(payload: {
  participantCode: string;
  cohortCode: string;
}) {
  const response = await fetch(`${API_BASE_URL}/api/v1/fieldwork/participants`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error("No se pudo crear el participante anónimo");
  }

  return response.json();
}
