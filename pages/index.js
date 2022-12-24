import { useAppContext } from '../hooks/useAppContext';
import {
  CreateWallet,
  ImportWallet,
  Intro,
  Success,
} from '../views/Onboarding';
import { Password, ResetWallet, Transactions } from '../views/Popup';

const screens = {
  Intro,
  CreateWallet,
  ImportWallet,
  Success,
  Password,
  Transactions,
  ResetWallet,
};

export default function App() {
  const { currentRoute, navigate } = useAppContext();

  const RenderScreen = screens[currentRoute];

  return RenderScreen ? <RenderScreen navigate={navigate} /> : null;
}
