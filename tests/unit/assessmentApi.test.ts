import { beforeEach, describe, it, expect, vi } from 'vitest';
const client = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn() }));
vi.mock('axios', () => ({ default: { create: () => client, isAxiosError: (e: unknown) => Boolean(e && typeof e === 'object' && 'isAxiosError' in e) } }));
import * as api from '../../src/services/assessmentApi';
const answers = Array.from({ length:12 }).flatMap(() => [4,3,2,1]);
const result = { assessmentId:'assessment',studentId:'student',instrumentVersion:'TEST_ONLY',createdAt:'2026-10-04',scoreCE:48,scoreRO:36,scoreAC:24,scoreAE:12,learningStyle:'synthetic' };
beforeEach(() => { client.get.mockReset(); client.post.mockReset(); });
describe('Kolb confirmation', () => {
  it.each([[], answers.slice(1), [...answers.slice(0,44),1,1,3,4]].map(input => [input]))('rejects incomplete or duplicate ranks before POST', async input => {
    await expect(api.submitKolbAssessmentWithConfirmation('student',input)).rejects.toThrow();
    expect(client.post).not.toHaveBeenCalled();
  });
  it('confirms matching persisted identity and version after exactly one POST', async () => {
    client.post.mockResolvedValue({data:result}); client.get.mockResolvedValue({data:[result]});
    expect(await api.submitKolbAssessmentWithConfirmation('student',answers)).toEqual({result,history:[result],confirmed:true});
    expect(client.post).toHaveBeenCalledTimes(1);
    expect(client.post).toHaveBeenCalledWith('/api/v1/assessments/kolb',{studentId:'student',answers});
  });
  it.each(['assessmentId','studentId','instrumentVersion','createdAt'])('does not confirm a different persisted %s', async field => {
    client.post.mockResolvedValue({data:result}); client.get.mockResolvedValue({data:[{...result,[field]:'different'}]});
    expect((await api.submitKolbAssessmentWithConfirmation('student',answers)).confirmed).toBe(false);
  });
  it.each(['assessmentId','studentId','instrumentVersion','createdAt'])('does not request history for an invalid returned %s', async field => {
    client.post.mockResolvedValue({data:{...result,[field]:''}});
    expect((await api.submitKolbAssessmentWithConfirmation('student',answers)).confirmed).toBe(false);
    expect(client.get).not.toHaveBeenCalled();
  });
  it('never repeats POST after failed history lookup', async () => {
    client.post.mockResolvedValue({data:result});client.get.mockRejectedValue(new Error('offline'));
    expect(await api.submitKolbAssessmentWithConfirmation('student',answers)).toEqual({result,history:[],confirmed:false});
    expect(client.post).toHaveBeenCalledTimes(1);
  });
  it('normalizes null, object and array history', async () => {
    for (const [data,expected] of [[null,[]],[result,[result]],[[result],[result]]]) {
      client.get.mockResolvedValue({data});expect(await api.fetchKolbAssessmentHistory('student')).toEqual(expected);
    }
  });
  it('accepts equal timestamps or finite numerical tolerance only', () => {
    expect(api.kolbTimestampMatches('same','same')).toBe(true);
    expect(api.kolbTimestampMatches(2,2.0000001)).toBe(true);
    for (const [left,right] of [[2,3],[NaN,NaN],[Infinity,2],['2',2]]) expect(api.kolbTimestampMatches(left,right)).toBe(false);
  });
  it('recognizes only the structured 422 validation rejection', () => {
    expect(api.isAssessmentSubmissionInvalid({isAxiosError:true,response:{status:422,data:{code:'ASSESSMENT_SUBMISSION_INVALID'}}})).toBe(true);
    for (const error of [null,{}, {isAxiosError:true}, {isAxiosError:true,response:{status:500}}, {isAxiosError:true,response:{status:422,data:{code:'other'}}}]) expect(api.isAssessmentSubmissionInvalid(error)).toBe(false);
  });
  it('sorts and repairs definition options without inventing questions', async () => {
    client.get.mockResolvedValue({data:{questions:[{id:1,questionNumber:2,text:'EducaciÃ³n',options:[{displayOrder:2,value:'B'},{displayOrder:1,label:'A'},{displayOrder:3,label:''}]}]}});
    expect(await api.fetchKolbQuestions()).toMatchObject([{id:'1',questionOrder:2,text:'Educación',options:['A','B']}]);
    client.get.mockResolvedValue({data:{}}); expect(await api.fetchKolbQuestions()).toEqual([]);
    client.get.mockResolvedValue({data:{questions:[{id:2}]}});expect(await api.fetchKolbQuestions()).toMatchObject([{questionOrder:0,text:'',options:[]}]);
  });
});

describe('Legacy assessment boundary', () => {
  it.each([api.submitKolbAssessment, api.submitFelderSilvermanAssessment, api.submitKuderAssessment])('blocks automatic answers without HTTP', async submit => {
    await expect(submit('student')).rejects.toThrow('LEGACY_ASSESSMENT_SUBMISSION_BLOCKED');
    expect(client.post).not.toHaveBeenCalled();
    expect(client.get).not.toHaveBeenCalled();
  });
  it('distinguishes explicit 410 from uncertain delivery', () => {
    expect(api.isAssessmentSubmissionBlocked({isAxiosError:true,response:{status:410}})).toBe(true);
    expect(api.isAssessmentSubmissionBlocked(new api.LegacyAssessmentSubmissionBlocked())).toBe(true);
    for (const error of [null, {}, new Error('timeout'), {isAxiosError:true,response:{status:500}}]) expect(api.isAssessmentSubmissionBlocked(error)).toBe(false);
  });
});
