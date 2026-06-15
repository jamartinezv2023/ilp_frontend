import axios from "axios";
import type { StudentProfile } from "../types/student";

const API_BASE_URL =
  import.meta.env.VITE_AUTH_API_BASE_URL ?? "http://localhost:8083";

const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 8000,
});

export const fetchStudents = async (): Promise<StudentProfile[]> => {
  const response = await client.get<StudentProfile[]>("/api/v1/students");
  return response.data;
};

export const fetchStudentById = async (
  id: string
): Promise<StudentProfile> => {
  const response = await client.get<StudentProfile>(`/api/v1/students/${id}`);
  return response.data;
};
