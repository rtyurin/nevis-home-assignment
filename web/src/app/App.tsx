import { ClientsPage } from '@/pages/clients';
import { AppProviders } from './AppProviders';

export function App() {
  return (
    <AppProviders>
      <ClientsPage />
    </AppProviders>
  );
}
