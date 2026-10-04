import { beforeEach, describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { I18nProvider } from '../../src/i18n/I18nProvider';
const transport=vi.hoisted(()=>({login:vi.fn(),refreshSession:vi.fn(),logoutSession:vi.fn()}));
vi.mock('../../src/features/auth/services/authApi',()=>transport);
import reducer from '../../src/features/auth/store/authSlice';
import { LoginForm } from '../../src/features/auth/components/LoginForm';
beforeEach(()=>{transport.login.mockReset();});
function mount(locale:'es'|'en'='es'){
 localStorage.setItem('ilp.locale',locale);const store=configureStore({reducer:{auth:reducer}});
 const view=render(<Provider store={store}><I18nProvider><LoginForm/></I18nProvider></Provider>);
 return {...view,store};
}
function credentials(en=false){
 fireEvent.change(screen.getByLabelText(en?'Institutional Email':'Correo institucional',{exact:false}),{target:{value:'synthetic@example.test'}});
 fireEvent.change(screen.getByLabelText(en?'Password':'Contraseña',{exact:false}),{target:{value:'TEST_ONLY_123'}});
}
function submit(container:HTMLElement){const form=container.querySelector('form');if(!form)throw new Error('missing form');fireEvent.submit(form);}
describe('login credential and MFA boundary',()=>{
 it.each(['es','en'] as const)('validates credentials before requesting and clears password after success in %s',async locale=>{
  const {container,store}=mount(locale);submit(container);expect(transport.login).not.toHaveBeenCalled();
  transport.login.mockResolvedValue({accessToken:'synthetic-token',email:'synthetic@example.test',mfaRequired:false});credentials(locale==='en');submit(container);
  await waitFor(()=>expect(store.getState().auth.accessToken).toBe('synthetic-token'));
  expect((screen.getByLabelText(locale==='en'?'Password':'Contraseña',{exact:false}) as HTMLInputElement).value).toBe('');
 });
 it.each(['es','en'] as const)('fails closed on missing token and network rejection in %s',async locale=>{
  const {container,store}=mount(locale);credentials(locale==='en');transport.login.mockResolvedValue({accessToken:null,email:null,mfaRequired:false});submit(container);
  await waitFor(()=>expect(store.getState().auth.error).not.toBeNull());expect(store.getState().auth.accessToken).toBeNull();
  transport.login.mockRejectedValueOnce(new Error('offline'));submit(container);await waitFor(()=>expect(transport.login).toHaveBeenCalledTimes(2));await waitFor(()=>expect(store.getState().auth.loading).toBe(false));
 });
 it('rejects invalid first MFA submission and accepts a six-digit code',async()=>{
  const {container,store}=mount();credentials();transport.login.mockResolvedValueOnce({accessToken:null,email:null,mfaRequired:true});submit(container);
  const code=await screen.findByLabelText('Código de verificación MFA',{exact:false});
  submit(container);expect(transport.login).toHaveBeenCalledTimes(1);
  expect((code as HTMLInputElement).getAttribute('aria-invalid')).toBe('true');
  fireEvent.change(code,{target:{value:'123456'}});transport.login.mockResolvedValueOnce({accessToken:'synthetic-token',email:'synthetic@example.test',mfaRequired:false});submit(container);
  await waitFor(()=>expect(store.getState().auth.accessToken).toBe('synthetic-token'));
  expect(transport.login).toHaveBeenLastCalledWith({email:'synthetic@example.test',password:'TEST_ONLY_123',mfaCode:123456,recoveryCode:undefined});
 });
 it('validates recovery format, uppercases it and permits switching back to authenticator',async()=>{
  const {container,store}=mount('en');credentials(true);transport.login.mockResolvedValueOnce({accessToken:null,email:null,mfaRequired:true});submit(container);
  fireEvent.click(await screen.findByRole('button',{name:'Use recovery code'}));
  submit(container);expect(transport.login).toHaveBeenCalledTimes(1);
  fireEvent.click(screen.getByRole('button',{name:'Use authenticator app'}));expect(screen.getByLabelText('MFA Verification Code',{exact:false})).toBeTruthy();
  fireEvent.click(screen.getByRole('button',{name:'Use recovery code'}));
  fireEvent.change(screen.getByLabelText('Recovery Code',{exact:false}),{target:{value:'abcd-efgh-jklm'}});
  transport.login.mockResolvedValueOnce({accessToken:'synthetic-token',email:'synthetic@example.test',mfaRequired:false});submit(container);
  await waitFor(()=>expect(store.getState().auth.accessToken).toBe('synthetic-token'));
  expect(transport.login).toHaveBeenLastCalledWith({email:'synthetic@example.test',password:'TEST_ONLY_123',mfaCode:undefined,recoveryCode:'ABCD-EFGH-JKLM'});
 });
});
