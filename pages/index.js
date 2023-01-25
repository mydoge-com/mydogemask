import { useAppContext } from '../hooks/useAppContext';
import { Password, ResetWallet } from '../views/Auth';
import { Connect } from '../views/Connect';
import {
  CreateWallet,
  ImportWallet,
  Intro,
  Success,
} from '../views/Onboarding';
import { Send } from '../views/Send';
import { Transactions } from '../views/Transactions';

const screens = {
  Intro,
  CreateWallet,
  ImportWallet,
  Success,
  Password,
  Transactions,
  ResetWallet,
  Send,
  Connect,
};

export default function App() {
  const { currentRoute } = useAppContext();

  const RenderScreen = screens[currentRoute];

  return RenderScreen ? <RenderScreen /> : null;
}
