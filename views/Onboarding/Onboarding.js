import { useCallback, useState } from 'react';

import { CreateWallet } from './components/CreateWallet';
import { HomeWrapper } from './components/HomeWrapper';
import { ImportWallet } from './components/ImportWallet';
import { Intro } from './components/Intro';
import { Success } from './components/Success';

const screens = {
  intro: Intro,
  createWallet: CreateWallet,
  importWallet: ImportWallet,
  success: Success,
};

export const Onboarding = () => {
  const [currentScreen, setCurrentScreen] = useState('intro');
  const RenderScreen = screens[currentScreen] ?? null;

  const setScreen = useCallback((id) => setCurrentScreen(id), []);

  return (
    <HomeWrapper>
      <RenderScreen setScreen={setScreen} />
    </HomeWrapper>
  );
};
