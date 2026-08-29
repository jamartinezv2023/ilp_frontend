import axios from "axios";
import type { StudentRecommendation } from "../types/recommendation";

import { ADAPTIVE_API_BASE_URL } from "../config/apiConfig";

const client = axios.create({
  baseURL: ADAPTIVE_API_BASE_URL,
  timeout: 8000,
});

export const fetchStudentRecommendations = async (
  studentId: string
): Promise<StudentRecommendation> => {
  const response = await client.get<StudentRecommendation>(
    `/api/v1/recommendations/students/${studentId}`
  );

  return response.data;
};

