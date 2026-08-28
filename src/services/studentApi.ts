import axios from "axios";
import type { StudentProfile } from "../types/student";

import { ADAPTIVE_API_BASE_URL } from "../config/apiConfig";
import {
  markStudentServiceFailed,
  markStudentServiceReady,
  markStudentServiceRequesting,
  markStudentServiceStarting,
} from "./studentServiceStatus";

const client = axios.create({
  baseURL: ADAPTIVE_API_BASE_URL,
  timeout: 45_000,
});

type BackendStudent = {
  id: number | string;
  name?: string;
  fullName?: string;
  email?: string;
  active?: boolean;
  createdAt?: string;
  updatedAt?: string;
  grade?: string;
  age?: number;
  learningProfile?: string;
  vocationalInterest?: string;
  supportLevel?: string;
  inclusiveStrategies?: string[];
  pedagogicalRecommendations?: string[];
};

export type StudentRequestRetry = {
  attempt: number;
  maxAttempts: number;
  delayMs: number;
};

export type StudentRequestOptions = {
  onRetry?: (retry: StudentRequestRetry) => void;
};

const MAX_ATTEMPTS = 3;
const RETRY_DELAYS_MS = [2_000, 5_000];
const RETRYABLE_STATUS_CODES = new Set([502, 503, 504]);

const wait = async (delayMs: number): Promise<void> =>
  new Promise((resolve) => window.setTimeout(resolve, delayMs));

const isRetryableRequestError = (error: unknown): boolean => {
  if (!axios.isAxiosError(error)) {
    return false;
  }

  if (!error.response) {
    return true;
  }

  return RETRYABLE_STATUS_CODES.has(error.response.status);
};

export type StudentRequestFailureKind =
  | "authentication"
  | "authorization"
  | "not-found"
  | "unavailable"
  | "network"
  | "unexpected";

export const classifyStudentRequestFailure = (
  error: unknown,
): StudentRequestFailureKind => {
  if (!axios.isAxiosError(error)) {
    return "unexpected";
  }

  const status = error.response?.status;

  if (status === 401) return "authentication";
  if (status === 403) return "authorization";
  if (status === 404) return "not-found";
  if (status !== undefined && RETRYABLE_STATUS_CODES.has(status)) {
    return "unavailable";
  }
  if (!error.response) return "network";

  return "unexpected";
};

const requestWithColdStartRetry = async <T>(
  request: () => Promise<T>,
  options: StudentRequestOptions,
): Promise<T> => {
  markStudentServiceRequesting();

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      const result = await request();
      markStudentServiceReady();
      return result;
    } catch (error) {
      const finalAttempt = attempt === MAX_ATTEMPTS;

      if (finalAttempt || !isRetryableRequestError(error)) {
        markStudentServiceFailed(classifyStudentRequestFailure(error));
        throw error;
      }

      const delayMs = RETRY_DELAYS_MS[attempt - 1];
      markStudentServiceStarting({
        attempt,
        maxAttempts: MAX_ATTEMPTS,
        delayMs,
      });
      options.onRetry?.({ attempt, maxAttempts: MAX_ATTEMPTS, delayMs });
      await wait(delayMs);
    }
  }

  throw new Error("Student request exhausted without a result.");
};

const toStudentProfile = (student: BackendStudent): StudentProfile => ({
  id: String(student.id),
  fullName: student.fullName ?? student.name ?? "Estudiante sin nombre",
  grade: student.grade ?? "Sin grado registrado",
  age: typeof student.age === "number" ? student.age : null,
  learningProfile: student.learningProfile ?? "Pendiente de evaluación",
  vocationalInterest: student.vocationalInterest ?? "Pendiente",
  supportLevel: student.supportLevel ?? "UNSPECIFIED",
  inclusiveStrategies: student.inclusiveStrategies ?? [],
  pedagogicalRecommendations: student.pedagogicalRecommendations ?? [],
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

export const fetchStudents = async (
  options: StudentRequestOptions = {},
): Promise<StudentProfile[]> =>
  requestWithColdStartRetry(async () => {
    const response = await client.get<StudentListResponse>("/api/v1/students");
    return normalizeStudents(response.data);
  }, options);

export const fetchStudentById = async (
  id: string,
  options: StudentRequestOptions = {},
): Promise<StudentProfile> =>
  requestWithColdStartRetry(async () => {
    const response = await client.get<BackendStudent>(`/api/v1/students/${id}`);
    return toStudentProfile(response.data);
  }, options);
