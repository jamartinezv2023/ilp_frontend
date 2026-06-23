import axios from "axios";
import type { StudentRecommendation } from "../types/recommendation";

const API_BASE_URL =
  import.meta.env.VITE_ADAPTIVE_API_BASE_URL || "";

const client = axios.create({
  baseURL: API_BASE_URL,
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

