import { beforeEach, describe, it, expect, vi } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
const transport=vi.hoisted(()=>({post:vi.fn()}));
vi.mock('axios',()=>({default:{create:()=>transport}}));
import * as api from '../../src/features/auth/services/authApi';
import reducer,{authenticationStarted,authenticationSucceeded,authenticationRequiresMfa,authenticationFailed,clearError,restoreSession,logout} from '../../src/features/auth/store/authSlice';
const response={accessToken:'synthetic-token',email:'synthetic@example.test',mfaRequired:false};
beforeEach(()=>{ transport.post.mockReset(); });
describe('session state and transport',()=>{
 it('keeps credentials in the auth transport and sends exact login payload',async()=>{
  transport.post.mockResolvedValue({data:response});
  const request={email:'synthetic@example.test',password:'TEST_ONLY',mfaCode:123456};
  expect(await api.login(request)).toEqual(response);expect(transport.post).toHaveBeenCalledWith('/auth/login',request);
  expect(await api.refreshSession()).toEqual(response);await api.logoutSession();
  expect(api.bearerHeaders('token')).toEqual({Authorization:'Bearer token','X-Tenant-Id':'11111111-1111-4111-8111-111111111111'});
 });
 it('clears tokens for MFA and failure and supports retry',()=>{
  let state=reducer(undefined,{type:'init'});state=reducer(state,authenticationStarted());expect(state.loading).toBe(true);
  state=reducer(state,authenticationSucceeded(response));expect(state.accessToken).toBe(response.accessToken);
  state=reducer(state,authenticationRequiresMfa());expect(state).toMatchObject({accessToken:null,mfaRequired:true,loading:false});
  state=reducer(state,authenticationFailed('denied'));expect(state).toMatchObject({accessToken:null,email:null,error:'denied'});
  state=reducer(state,clearError());expect(state.error).toBeNull();
 });
 it.each([true,false])('restores session with successful=%s',async success=>{
  const store=configureStore({reducer:{auth:reducer}});
  if(success)transport.post.mockResolvedValue({data:response});else transport.post.mockRejectedValue(new Error('denied'));
  await store.dispatch(restoreSession());expect(store.getState().auth.initializing).toBe(false);
  expect(store.getState().auth.accessToken).toBe(success?response.accessToken:null);
 });
 it.each([true,false])('clears local session even when logout request successful=%s',async success=>{
  const store=configureStore({reducer:{auth:reducer}});store.dispatch(authenticationSucceeded(response));
  if(success)transport.post.mockResolvedValue({});else transport.post.mockRejectedValue(new Error('offline'));
  await store.dispatch(logout());expect(store.getState().auth).toMatchObject({initializing:false,accessToken:null,email:null});
 });
 it('clears session on a rejected logout action',()=>{
  expect(reducer(reducer(undefined,authenticationSucceeded(response)),logout.rejected(new Error('error'),'id'))).toMatchObject({accessToken:null,initializing:false});
 });
});
