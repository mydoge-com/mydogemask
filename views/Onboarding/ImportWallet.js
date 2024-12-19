import { Text, VStack } from 'native-base';
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

import { BackButton } from '../../components/BackButton';
import { Footer } from '../../components/Footer';
import { WalletRestore } from '../../components/WalletRestore';
import { DISPATCH_TYPES } from '../../Context';
import { useAppContext } from '../../hooks/useAppContext';
import { OnboardingLayout } from './OnboardingLayout';

export const ImportWallet = () => {
  const navigate = useNavigate();
  const { dispatch } = useAppContext();
  const onConfirm = useCallback(
    ({ authenticated, wallet }) => {
      dispatch({
        type: DISPATCH_TYPES.SIGN_IN,
        payload: {
          authenticated,
          wallet,
          navigate: '/Success',
        },
      });
      dispatch({
        type: DISPATCH_TYPES.SELECT_WALLET,
        payload: { index: 0 },
      });
      dispatch({
        type: DISPATCH_TYPES.SET_ONBOARDING_COMPLETE,
        payload: true,
      });
    },
    [dispatch]
  );

  const onBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  return (
    <OnboardingLayout>
      <VStack px='15%' justifyContent='center' h='100%'>
        <BackButton onPress={onBack} mb='15px' />
        <VStack bg='white' py='20px' rounded='sm' px='40px'>
          <Text fontSize='2xl'>
            Import <Text fontWeight='bold'>Wallet</Text>
          </Text>
          <Text color='gray.500' fontSize='14px'>
            Enter your secret seed phrase to import your wallet into MyDoge
          </Text>
          <WalletRestore
            confirmBefore={false}
            onRestoreComplete={onConfirm}
            submitLabel='Import'
            pt='12px'
          />
        </VStack>
        <Footer mt='40px' />
      </VStack>
    </OnboardingLayout>
  );
};
