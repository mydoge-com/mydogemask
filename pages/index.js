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
import { InscribeToken } from '../views/InscribeToken';
import { TransferToken } from '../views/TransferToken';
import { Transactions } from '../views/Transactions';

import {
  Routes,
  Route,
} from 'react-router-dom';

export default function App() {
  const { authenticated, wallet, onboardingComplete } = useAppContext();

  const BaseComponent = !onboardingComplete
    ? Intro
    : authenticated && wallet
    ? Transactions
    : Password;

  return (
      <Routes>
        <Route path='/' element={<BaseComponent />} />
        <Route path='/Intro' element={<Intro />} />
        <Route path='/CreateWallet' element={<CreateWallet />} />
        <Route path='/ImportWallet' element={<ImportWallet />} />
        <Route path='/Success' element={<Success />} />
        <Route path='/Password' element={<Password />} />
        <Route path='/Transactions/:tab?' element={<Transactions />} />
        <Route path='/ResetWallet' element={<ResetWallet />} />
        <Route path='/Send' element={<Send />} />
        <Route path='/SendNFT' element={<SendNFT />} />
        <Route path='/InscribeToken' element={<InscribeToken />} />
        <Route path='/TransferToken' element={<TransferToken />} />
        <Route path='/ClientConnect' element={<ClientConnect />} />
        <Route path='/ClientTransaction' element={<ClientTransaction />} />
      </Routes>
  )

  
}
