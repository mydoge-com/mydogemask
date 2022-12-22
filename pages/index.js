import { useAppContext } from '../hooks/useAppContext';
import { Onboarding } from '../views/Onboarding/Onboarding';
import { Popup } from '../views/Popup/Popup';

export default function App() {
  const { onboardingComplete } = useAppContext();

  if (onboardingComplete === undefined) {
    return null;
  }

  return !onboardingComplete ? <Onboarding /> : <Popup />;
}
