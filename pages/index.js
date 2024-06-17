import { useAppContext } from '../hooks/useAppContext';
import { Password, ResetWallet } from '../views/Auth';
import { ClientConnect, ClientTransaction } from '../views/ClientRequests';
import {
  CreateWallet,
  ImportWallet,
  Intro,
  Success
} from '../views/Onboarding';
import { Send } from '../views/Send';
import { Transactions } from '../views/Transactions';
import { Drc20TransferHistory } from '../views/Cardinals/Drc20TransferHistory';
import { TransferDetailScreen } from '../views/Cardinals/TransferDetailScreen';

const screens = {
  Intro,
  CreateWallet,
  ImportWallet,
  Success,
  Password,
  Transactions,
  ResetWallet,
  Send,
  ClientConnect,
  ClientTransaction,
  Drc20TransferHistory,
  TransferDetailScreen
};

export default function App() {
  const { currentRoute } = useAppContext();

  const RenderScreen = screens[currentRoute];

  return RenderScreen ? <RenderScreen /> : null;
}
