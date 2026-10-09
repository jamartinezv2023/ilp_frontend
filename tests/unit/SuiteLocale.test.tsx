import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { I18nProvider, useI18n } from '../../src/i18n/I18nProvider';
import { suiteMessages } from '../../src/i18n/suiteMessages';
const api = vi.hoisted(() => ({ fetchStudents: vi.fn(), fetchResearchSignals: vi.fn() }));
vi.mock('../../src/services/studentApi', () => ({ fetchStudents: api.fetchStudents }));
vi.mock('../../src/services/recommendationApi', () => ({fetchStudentRecommendations:vi.fn().mockResolvedValue(null)}));
vi.mock('../../src/services/researchApi', () => ({ fetchResearchSignals: api.fetchResearchSignals }));
vi.mock('../../src/components/StudentServiceStatusAlert', () => ({StudentServiceStatusAlert:()=>null}));
import { TeacherWorkspacePage } from '../../src/pages/teacher/TeacherWorkspacePage';
import { FamilyEngagementPage } from '../../src/pages/family/FamilyEngagementPage';
import { StudentSupportPage } from '../../src/pages/students/StudentSupportPage';
import { InclusionPiarPage } from '../../src/pages/inclusion/InclusionPiarPage';
import { AdaptiveIntelligencePage } from '../../src/pages/adaptive/AdaptiveIntelligencePage';
import { ResearchCenterPage } from '../../src/pages/research/ResearchCenterPage';
import { DashboardPage } from '../../src/pages/dashboard/DashboardPage';
function Switch(){const {locale,setLocale}=useI18n();return <button onClick={()=>setLocale(locale==='es'?'en':'es')}>Switch test locale</button>;}
const profile = {id:'SYNTHETIC',fullName:'Synthetic High',grade:'TEST',age:16,learningProfile:'Unassessed',vocationalInterest:'Unassessed',supportLevel:'HIGH',inclusiveStrategies:[],pedagogicalRecommendations:[]};
beforeEach(()=>{api.fetchStudents.mockReset().mockResolvedValue([profile]);api.fetchResearchSignals.mockReset().mockResolvedValue([]);});
const pages=[
 ['Teacher Workspace',TeacherWorkspacePage,true],['Family Engagement Center',FamilyEngagementPage,true],['Student Support Profile',StudentSupportPage,true],['Inclusion & PIAR Center',InclusionPiarPage,true],['Adaptive Intelligence Center',AdaptiveIntelligencePage,true],['Inclusive Educational AI Research Center',ResearchCenterPage,false],['Executive Research Dashboard',DashboardPage,false],
] as const;
describe('Suite localization without DOM translation',()=>{
 for(const [title,Page,hasStudents]of pages){
  it.each(['es','en'] as const)(`${title} switches from %s and preserves API data`,async initial=>{
   localStorage.setItem('ilp.locale',initial);
   render(<I18nProvider><Switch/><Page/></I18nProvider>);
   const labels=title==='Executive Research Dashboard'?{es:'Panel ejecutivo de investigación',en:title}:suiteMessages[title];
   expect(labels).toBeTruthy();
   if(hasStudents)expect((await screen.findAllByText('Synthetic High')).length).toBeGreaterThan(0);
   const requests=api.fetchStudents.mock.calls.length;
   for(const locale of [initial,initial==='es'?'en':'es',initial] as const){
    if(locale!==document.documentElement.lang)fireEvent.click(screen.getByText('Switch test locale'));
    expect(screen.getByText(labels[locale])).toBeTruthy();
    expect(screen.queryByText(labels[locale==='es'?'en':'es'])).toBeNull();
    if(hasStudents){expect(screen.getAllByText('Synthetic High').length).toBeGreaterThan(0);expect(api.fetchStudents.mock.calls.length).toBe(requests);}
   }
  });
 }
});
