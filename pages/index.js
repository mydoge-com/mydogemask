import React, { useEffect } from 'react';

import { useAppContext } from '../hooks/useAppContext';
import { Onboarding } from '../views/Onboarding/Onboarding';
import { Popup } from '../views/Popup/Popup';

export default function App() {
  const { isOnboardingComplete } = useAppContext();
  useEffect(() => {
    console.log({ isOnboardingComplete });
  }, [isOnboardingComplete]);
  console.log({ isOnboardingComplete });

  return !isOnboardingComplete ? <Onboarding /> : <Popup />;
}
