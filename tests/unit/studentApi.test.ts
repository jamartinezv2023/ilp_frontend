import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AxiosError, AxiosHeaders } from 'axios';
const transport = vi.hoisted(() => ({ get: vi.fn() }));
vi.mock('axios', async (importOriginal) => {
  const actual = await importOriginal<typeof import('axios')>();
  return { ...actual, default: { ...actual.default, create: () => transport } };
});
import { classifyStudentRequestFailure, fetchStudentById, fetchStudents } from '../../src/services/studentApi';
import {
  getStudentServiceStatus, markStudentServiceFailed, markStudentServiceReady,
  markStudentServiceRequesting, markStudentServiceStarting, subscribeStudentServiceStatus,
} from '../../src/services/studentServiceStatus';
function failure(status?: number) {
  return new AxiosError('Synthetic transport failure', 'TEST_ONLY', undefined, undefined,
    status === undefined ? undefined : {
      status, statusText: 'Synthetic', data: {}, headers: {}, config: { headers: new AxiosHeaders() },
    });
}
beforeEach(() => { transport.get.mockReset(); markStudentServiceReady(); });
afterEach(() => { vi.useRealTimers(); });
describe('student response and service availability contracts', () => {
  it.each(['array', 'value', 'content', 'data'])('normalizes %s responses without inventing recorded data', async shape => {
    const student = { id: 42, name: 'Synthetic learner' };
    const payload = shape === 'array' ? [student] : { [shape]: [student] };
    transport.get.mockResolvedValue({ data: payload });
    expect(await fetchStudents()).toEqual([{
      id: '42', fullName: 'Synthetic learner', grade: 'Sin grado registrado', age: null,
      learningProfile: 'Pendiente de evaluación', vocationalInterest: 'Pendiente',
      supportLevel: 'UNSPECIFIED', inclusiveStrategies: [], pedagogicalRecommendations: [],
    }]);
    expect(transport.get).toHaveBeenCalledWith('/api/v1/students');
    expect(getStudentServiceStatus()).toEqual({ phase: 'ready' });
  });
  it('preserves recorded profile fields and prioritizes fullName', async () => {
    const student = { id: 'synthetic-42', fullName: 'Recorded synthetic name', name: 'Fallback name',
      grade: '10', age: 16, learningProfile: 'TEST', vocationalInterest: 'SCIENCE',
      supportLevel: 'LOW', inclusiveStrategies: ['TEST_STRATEGY'], pedagogicalRecommendations: ['TEST_RECOMMENDATION'] };
    transport.get.mockResolvedValue({ data: student });
    expect(await fetchStudentById('synthetic-42')).toEqual({
      id: 'synthetic-42', fullName: 'Recorded synthetic name', grade: '10', age: 16,
      learningProfile: 'TEST', vocationalInterest: 'SCIENCE', supportLevel: 'LOW',
      inclusiveStrategies: ['TEST_STRATEGY'], pedagogicalRecommendations: ['TEST_RECOMMENDATION'],
    });
    expect(transport.get).toHaveBeenCalledWith('/api/v1/students/synthetic-42');
  });
  it('uses explicit display fallbacks for a profile with missing name and invalid age', async () => {
    transport.get.mockResolvedValue({ data: { id: 7, age: 'unknown' } });
    expect(await fetchStudentById('7')).toMatchObject({ id: '7', fullName: 'Estudiante sin nombre', age: null });
  });
  it('rejects an unsupported envelope instead of reporting no students', async () => {
    transport.get.mockResolvedValue({ data: { value: {}, content: {}, data: {} } });
    await expect(fetchStudents()).rejects.toThrow('invalid response');
    expect(transport.get).toHaveBeenCalledTimes(1);
    expect(getStudentServiceStatus()).toEqual({
      phase: 'failed', failureKind: 'unexpected',
    });
  });
  it.each([
    { status: 401, kind: 'authentication' }, { status: 403, kind: 'authorization' },
    { status: 404, kind: 'not-found' }, { status: 500, kind: 'unexpected' },
  ])('does not retry HTTP $status and preserves the original error', async ({ status, kind }) => {
    const error = failure(status); transport.get.mockRejectedValue(error);
    const onRetry = vi.fn();
    await expect(fetchStudents({ onRetry })).rejects.toBe(error);
    expect(classifyStudentRequestFailure(error)).toBe(kind);
    expect(transport.get).toHaveBeenCalledTimes(1); expect(onRetry).not.toHaveBeenCalled();
    expect(getStudentServiceStatus()).toEqual({ phase: 'failed', failureKind: kind });
  });
  it('does not retry a non-transport error', async () => {
    const error = new Error('Synthetic unexpected failure'); transport.get.mockRejectedValue(error);
    await expect(fetchStudentById('7')).rejects.toBe(error);
    expect(classifyStudentRequestFailure(error)).toBe('unexpected');
    expect(transport.get).toHaveBeenCalledTimes(1);
  });
  it.each([502, 503, 504, undefined])('recovers a transient failure with status %s after the configured delay', async status => {
    vi.useFakeTimers(); const error = failure(status);
    transport.get.mockRejectedValueOnce(error).mockResolvedValueOnce({ data: [] });
    const onRetry = vi.fn(); const result = fetchStudents({ onRetry });
    await vi.advanceTimersByTimeAsync(0);
    expect(getStudentServiceStatus()).toEqual({ phase: 'starting', attempt: 1, maxAttempts: 3, delayMs: 2000 });
    expect(transport.get).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1999); expect(transport.get).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1); expect(await result).toEqual([]);
    expect(onRetry).toHaveBeenCalledWith({ attempt: 1, maxAttempts: 3, delayMs: 2000 });
    expect(transport.get).toHaveBeenCalledTimes(2);
    expect(getStudentServiceStatus()).toEqual({ phase: 'ready' });
  });
  it.each([503, undefined])('stops after three attempts and classifies the final failure with status %s', async status => {
    vi.useFakeTimers(); const error = failure(status); transport.get.mockRejectedValue(error);
    const result = fetchStudents(); const rejected = expect(result).rejects.toBe(error);
    await vi.advanceTimersByTimeAsync(2000);
    expect(getStudentServiceStatus()).toEqual({ phase: 'starting', attempt: 2, maxAttempts: 3, delayMs: 5000 });
    await vi.advanceTimersByTimeAsync(5000); await rejected;
    expect(transport.get).toHaveBeenCalledTimes(3);
    expect(getStudentServiceStatus()).toEqual({ phase: 'failed', failureKind: status === undefined ? 'network' : 'unavailable' });
  });
  it('publishes state transitions and respects unsubscribe and the starting state', () => {
    const listener = vi.fn(); const unsubscribe = subscribeStudentServiceStatus(listener);
    markStudentServiceRequesting(); expect(getStudentServiceStatus()).toEqual({ phase: 'requesting' });
    markStudentServiceStarting({ attempt: 1, maxAttempts: 3, delayMs: 2000 });
    markStudentServiceRequesting(); expect(listener).toHaveBeenCalledTimes(2);
    expect(getStudentServiceStatus()).toMatchObject({ phase: 'starting' });
    markStudentServiceFailed('authorization'); expect(listener).toHaveBeenCalledTimes(3);
    unsubscribe(); markStudentServiceReady(); expect(listener).toHaveBeenCalledTimes(3);
    expect(getStudentServiceStatus()).toEqual({ phase: 'ready' });
  });
});

describe('student API rejects malformed data without inventing empty results', () => {
  it.each(['array', 'value', 'content', 'data'])(
    'accepts a valid empty %s collection', async shape => {
      const payload = shape === 'array' ? [] : { [shape]: [] };
      transport.get.mockResolvedValue({ data: payload });
      expect(await fetchStudents()).toEqual([]);
      expect(getStudentServiceStatus()).toEqual({ phase: 'ready' });
    },
  );
  it.each([
    null, undefined, false, 42, 'invalid', {},
    { value: null }, { content: {} }, { data: 'invalid' },
    { value: [], content: [] },
    [null], [{}], [{ id: '' }], [{ id: '   ' }],
    [{ id: {} }], [{ id: 1.5 }],
    [{ id: 1, fullName: 7 }],
    [{ id: 1, inclusiveStrategies: 'invalid' }],
    [{ id: 1, pedagogicalRecommendations: [false] }],
    [{ id: 1 }, { name: 'Missing identity' }],
  ])('rejects malformed list case %# without retrying', async payload => {
    transport.get.mockResolvedValue({ data: payload });
    const onRetry = vi.fn();
    await expect(fetchStudents({ onRetry })).rejects.toThrow('invalid response');
    expect(transport.get).toHaveBeenCalledTimes(1);
    expect(onRetry).not.toHaveBeenCalled();
    expect(getStudentServiceStatus()).toEqual({
      phase: 'failed', failureKind: 'unexpected',
    });
  });
  it.each([null, {}, { id: '' }, { id: 1, supportLevel: false }])(
    'rejects malformed individual profile case %#', async payload => {
      transport.get.mockResolvedValue({ data: payload });
      await expect(fetchStudentById('synthetic')).rejects.toThrow('invalid response');
      expect(transport.get).toHaveBeenCalledTimes(1);
      expect(getStudentServiceStatus().phase).toBe('failed');
    },
  );
  it('recovers after malformed data only when a later query returns valid data', async () => {
    transport.get.mockResolvedValueOnce({ data: {} })
      .mockResolvedValueOnce({ data: [{ id: 'synthetic-1' }] });
    await expect(fetchStudents()).rejects.toThrow('invalid response');
    expect(getStudentServiceStatus().phase).toBe('failed');
    expect(await fetchStudents()).toHaveLength(1);
    expect(getStudentServiceStatus()).toEqual({ phase: 'ready' });
    expect(transport.get).toHaveBeenCalledTimes(2);
  });
  it.each([401, 403])(
    'preserves HTTP %s denial and recovers on a later valid query', async status => {
      const error = failure(status);
      transport.get.mockRejectedValueOnce(error)
        .mockResolvedValueOnce({ data: [] });
      await expect(fetchStudents()).rejects.toBe(error);
      expect(getStudentServiceStatus()).toEqual({
        phase: 'failed',
        failureKind: status === 401 ? 'authentication' : 'authorization',
      });
      expect(transport.get).toHaveBeenCalledTimes(1);
      expect(await fetchStudents()).toEqual([]);
      expect(getStudentServiceStatus()).toEqual({ phase: 'ready' });
    },
  );
});
