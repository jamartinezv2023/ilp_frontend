import { useState } from "react";
import { createParticipant, registerConsent } from "../api/fieldworkApi";

export function FieldworkDemoPage() {
  const [participantCode, setParticipantCode] = useState("DEMO-001");
  const [cohortCode, setCohortCode] = useState("COHORT-2026");
  const [result, setResult] = useState("");

  async function handleDemo() {
    try {
      const consent = await registerConsent({
        participantCode,
        consentType: "DEMO_CONSENT",
        status: "APPROVED",
      });

      const participant = await createParticipant({
        participantCode,
        cohortCode,
      });

      setResult(JSON.stringify({ consent, participant }, null, 2));
    } catch (error) {
      setResult(error instanceof Error ? error.message : "Error inesperado");
    }
  }

  return (
    <main style={{ padding: "2rem", maxWidth: "900px", margin: "0 auto" }}>
      <h1>ILP Fieldwork Demo</h1>
      <p>Demo de consentimiento y participante anónimo. No usar datos reales sin aprobación ética.</p>

      <label>
        Código demo del participante
        <input
          value={participantCode}
          onChange={(event) => setParticipantCode(event.target.value)}
          style={{ display: "block", width: "100%", marginTop: "0.5rem" }}
        />
      </label>

      <br />

      <label>
        Cohorte
        <input
          value={cohortCode}
          onChange={(event) => setCohortCode(event.target.value)}
          style={{ display: "block", width: "100%", marginTop: "0.5rem" }}
        />
      </label>

      <br />

      <button onClick={handleDemo}>
        Registrar consentimiento y crear participante anónimo
      </button>

      <pre style={{ marginTop: "2rem", background: "#f5f5f5", padding: "1rem", whiteSpace: "pre-wrap" }}>
        {result}
      </pre>
    </main>
  );
}

