import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
const transport = vi.hoisted(() => ({ get: vi.fn() }));
vi.mock("axios", () => ({ default: { create: () => ({ get: transport.get }) } }));
vi.mock("../../src/components/StudentServiceStatusAlert", () => ({ StudentServiceStatusAlert: () => null }));
import { I18nProvider } from "../../src/i18n/I18nProvider";
import { AdaptiveIntelligencePage } from "../../src/pages/adaptive/AdaptiveIntelligencePage";
import { fetchAdaptivePlanHistory, parseAdaptivePlan } from "../../src/services/adaptiveApi";
const student = { id: "S1", fullName: "Synthetic High", supportLevel: "HIGH", grade: "7" };
const plan = { planId: null, createdAt: null, studentId: "S1", fullName: "Synthetic High",
 learningProfile: "DIVERGENT", vocationalInterest: "SCIENTIFIC", supportLevel: "HIGH",
 riskLevel: "HIGH", recommendedMethodology: "PROJECT_BASED_LEARNING", learningPreferences: [],
 recommendedResources: [], adaptivePathway: [], teacherActions: [], inclusionActions: [], familyActions: [] };

beforeEach(() => { transport.get.mockReset(); });
it.each([null, {}, [], { ...plan, teacherActions: [null] }])("rejects a malformed preview", value => {
 expect(() => parseAdaptivePlan(value)).toThrow();
});
it("distinguishes valid empty history from malformed history", async () => {
 transport.get.mockResolvedValueOnce({ data: [] }).mockResolvedValueOnce({ data: {} });
 await expect(fetchAdaptivePlanHistory("S1")).resolves.toEqual([]);
 await expect(fetchAdaptivePlanHistory("S1")).rejects.toThrow();
});
describe.each(["es", "en"])("preview cycle in %s", locale => {
 it("hides old data during refresh and recovers after failure without writes", async () => {
  localStorage.setItem("ilp.locale", locale);
  let release: (value: { data: typeof plan }) => void = () => {};
  const pending = new Promise<{ data: typeof plan }>(resolve => { release = resolve; });
  transport.get.mockResolvedValueOnce({ data: [student] }).mockResolvedValueOnce({ data: plan })
   .mockReturnValueOnce(pending).mockRejectedValueOnce(new Error("Denied"))
   .mockResolvedValueOnce({ data: plan });
  render(<I18nProvider><AdaptiveIntelligencePage /></I18nProvider>);
  const refresh = locale === "es" ? "Actualizar vista previa" : "Refresh preview";
  await screen.findByRole("button", { name: refresh });
  fireEvent.click(screen.getByRole("button", { name: refresh }));
  expect(screen.queryByRole("button", { name: refresh })).toBeNull();
  expect(screen.queryByText(/Riesgo adaptativo:|Adaptive risk:/)).toBeNull();
  release({ data: plan });
  await screen.findByRole("button", { name: refresh });
  fireEvent.click(screen.getByRole("button", { name: refresh }));
  const retry = locale === "es" ? "Reintentar consulta" : "Retry preview";
  await screen.findByRole("button", { name: retry });
  expect(screen.queryByRole("button", { name: refresh })).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: retry }));
  await screen.findByRole("button", { name: refresh });
  await waitFor(() => expect(transport.get).toHaveBeenCalledTimes(5));
  expect(transport.get.mock.calls.every(([url]) => typeof url === "string")).toBe(true);
 });
});
