import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { I18nProvider } from '../../src/i18n/I18nProvider';
import { messages } from '../../src/i18n/messages';
const dispatch=vi.hoisted(()=>vi.fn());
vi.mock('../../src/store/hooks',()=>({useAppDispatch:()=>dispatch}));
vi.mock('../../src/routes/AppRoutes',()=>({AppRoutes:()=>null}));
import { AccessibleAppShell } from '../../src/layouts/AccessibleAppShell';
import { AppShell } from '../../src/layouts/AppShell';
function Location(){return <output data-testid="location">{useLocation().pathname}</output>;}
describe('navigation and accessible application shell',()=>{
 it.each(['es','en'] as const)('navigates, filters and focuses main content in %s',async locale=>{
  localStorage.setItem('ilp.locale',locale);
  render(<MemoryRouter initialEntries={['/institutional']}><I18nProvider><AccessibleAppShell/><Location/></I18nProvider></MemoryRouter>);
  fireEvent.click(screen.getAllByRole('button',{name:messages[locale]['nav.teacher']})[0]);
  await waitFor(()=>expect(screen.getByTestId('location').textContent).toBe('/teacher'));
  expect(document.activeElement?.id).toBe('main-content');
  const search=screen.getByRole('textbox',{name:messages[locale]['shell.searchLabel']});
  fireEvent.change(search,{target:{value:messages[locale]['nav.students']}});fireEvent.keyDown(search,{key:'Enter'});
  await waitFor(()=>expect(screen.getByTestId('location').textContent).toBe('/students'));
  fireEvent.change(search,{target:{value:'not-a-route'}});fireEvent.keyDown(search,{key:'Escape'});expect((search as HTMLInputElement).value).toBe('');
  fireEvent.click(screen.getByRole('button',{name:messages[locale]['shell.collapse']}));
  fireEvent.click(screen.getByRole('button',{name:messages[locale]['shell.expand']}));
  fireEvent.click(screen.getAllByRole('button',{name:messages[locale]['shell.logout']})[0]);
  expect(dispatch).toHaveBeenCalled();
 });
 it('navigates the compatibility shell and dispatches logout',async()=>{
  render(<MemoryRouter initialEntries={['/institutional']}><AppShell/><Location/></MemoryRouter>);
  fireEvent.click(screen.getAllByRole('button',{name:'Teacher Workspace'})[0]);
  await waitFor(()=>expect(screen.getByTestId('location').textContent).toBe('/teacher'));
  fireEvent.click(screen.getAllByRole('button',{name:'Logout'})[0]);expect(dispatch).toHaveBeenCalled();
 });
});
