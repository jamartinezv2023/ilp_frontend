import ReactDOM from 'react-dom/client';
import { I18nProvider } from '../../src/i18n/I18nProvider';
import { OfflineLab } from '../../src/features/offline/OfflineLab';
const owner = new URLSearchParams(location.search).get('owner') === 'B' ? 'SYNTHETIC_OWNER_B' : 'SYNTHETIC_OWNER_A';
const scope = { ownerId: owner, tenantId: 'SYNTHETIC_TENANT', assignmentId: 'SYNTHETIC_ASSIGNMENT', instrumentVersion: 'p02-synthetic-v1' };
ReactDOM.createRoot(document.getElementById('root')!).render(<I18nProvider><OfflineLab scope={scope} /></I18nProvider>);
