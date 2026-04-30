import { Suspense } from 'react';

import RegistrationPage from './RegistrationPage';

export default function Page() {
  return (
    <Suspense fallback={null}>
      <RegistrationPage />
    </Suspense>
  );
}
