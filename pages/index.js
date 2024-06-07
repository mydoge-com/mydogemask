import { useAppContext } from '../hooks/useAppContext';
import { Password, ResetWallet } from '../views/Auth';
import { ClientConnect, ClientTransaction } from '../views/ClientRequests';
import {
  CreateWallet,
  ImportWallet,
  Intro,
  Success,
} from '../views/Onboarding';
import { Send } from '../views/Send';
import { SendNFT } from '../views/Send/SendNFT';
import { TransferAvailable } from '../views/Send/TransferAvailable';
import { TransferToken } from '../views/Send/TransferToken';
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
  SendNFT,
  TransferAvailable,
  TransferToken,
  ClientConnect,
  ClientTransaction,
};

export default function App() {
  const { currentRoute } = useAppContext();

  const RenderScreen = screens[currentRoute];

  return RenderScreen ? <RenderScreen /> : null;
}
