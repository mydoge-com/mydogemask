import { useAppContext } from '../hooks/useAppContext';
import {
  CreateWallet,
  ImportWallet,
  Intro,
  Success,
} from '../views/Onboarding';
import { Password, Transactions } from '../views/Popup';

const screens = {
  intro: Intro,
  createWallet: CreateWallet,
  importWallet: ImportWallet,
  success: Success,
  password: Password,
  transactions: Transactions,
};

export default function App() {
  const { currentRoute, navigate } = useAppContext();

  const RenderScreen = screens[currentRoute];

  return RenderScreen ? <RenderScreen navigate={navigate} /> : null;
}
