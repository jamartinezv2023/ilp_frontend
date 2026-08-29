import axios from "axios";
import type { AssessmentDefinition } from "../types/assessmentDefinition";

import { ADAPTIVE_API_BASE_URL } from "../config/apiConfig";
import { normalizeUtf8Text } from "../utils/utf8Text";

const client = axios.create({
  baseURL: ADAPTIVE_API_BASE_URL,
  timeout: 10000,
});

export const fetchAssessmentDefinition = async (
  code: string
): Promise<AssessmentDefinition> => {
  const response = await client.get<AssessmentDefinition>(
    `/api/v1/assessment-definitions/${code}`
  );

  return normalizeUtf8Text(response.data);
};

