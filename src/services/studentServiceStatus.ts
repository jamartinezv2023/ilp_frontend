import type { StudentRequestFailureKind, StudentRequestRetry } from "./studentApi";

export type StudentServiceState =
  | { phase: "idle" | "requesting" | "ready" }
  | ({ phase: "starting" } & StudentRequestRetry)
  | { phase: "failed"; failureKind: StudentRequestFailureKind };

let currentState: StudentServiceState = { phase: "idle" };
const listeners = new Set<() => void>();

const publish = (state: StudentServiceState): void => {
  currentState = state;
  listeners.forEach((listener) => listener());
};

export const subscribeStudentServiceStatus = (listener: () => void): (() => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const getStudentServiceStatus = (): StudentServiceState => currentState;

export const markStudentServiceRequesting = (): void => {
  if (currentState.phase !== "starting") {
    publish({ phase: "requesting" });
  }
};

export const markStudentServiceStarting = (retry: StudentRequestRetry): void => {
  publish({ phase: "starting", ...retry });
};

export const markStudentServiceReady = (): void => publish({ phase: "ready" });

export const markStudentServiceFailed = (
  failureKind: StudentRequestFailureKind,
): void => publish({ phase: "failed", failureKind });
