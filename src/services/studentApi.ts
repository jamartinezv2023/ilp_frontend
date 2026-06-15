import axios from "axios";
import type { StudentProfile } from "../types/student";

const API_BASE_URL =
  import.meta.env.VITE_AUTH_API_BASE_URL || "";

const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 8000,
});

type BackendStudent = {
  id: number | string;
  name?: string;
  fullName?: string;
  email?: string;
  active?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

const toStudentProfile = (student: BackendStudent): StudentProfile => ({
  id: String(student.id),
  fullName: student.fullName ?? student.name ?? "Estudiante sin nombre",
  grade: "10",
  age: 15,
  learningProfile: "Pendiente de evaluación",
  vocationalInterest: "Pendiente",
  supportLevel: "MEDIUM",
  inclusiveStrategies: [
    "Diseño Universal para el Aprendizaje",
    "Aprendizaje cooperativo",
  ],
  pedagogicalRecommendations: [
    "Realizar seguimiento semanal",
    "Aplicar instrumentos de caracterización",
  ],
});

type StudentListResponse =
  | BackendStudent[]
  | {
      value?: BackendStudent[];
      content?: BackendStudent[];
      data?: BackendStudent[];
      Count?: number;
    };

const normalizeStudents = (payload: StudentListResponse): StudentProfile[] => {
  if (Array.isArray(payload)) {
    return payload.map(toStudentProfile);
  }

  if (Array.isArray(payload.value)) {
    return payload.value.map(toStudentProfile);
  }

  if (Array.isArray(payload.content)) {
    return payload.content.map(toStudentProfile);
  }

  if (Array.isArray(payload.data)) {
    return payload.data.map(toStudentProfile);
  }

  return [];
};

export const fetchStudents = async (): Promise<StudentProfile[]> => {
  const response = await client.get<StudentListResponse>("/api/v1/students");
  return normalizeStudents(response.data);
};

export const fetchStudentById = async (
  id: string
): Promise<StudentProfile> => {
  const response = await client.get<BackendStudent>(`/api/v1/students/${id}`);
  return toStudentProfile(response.data);
};
