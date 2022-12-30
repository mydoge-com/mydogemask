import { Box, Icon, Text, VStack } from 'native-base';
import { useCallback } from 'react';
import { CgDanger } from 'react-icons/cg';

import { BackButton } from '../../components/BackButton';
import { Layout } from '../../components/Layout';
import { WalletRestore } from '../../components/WalletRestore';
import { useAppContext } from '../../hooks/useAppContext';

export const ResetWallet = () => {
  const { navigate } = useAppContext();

  const onRestoreComplete = useCallback(() => {
    navigate('Success');
  }, [navigate]);

  const onBack = useCallback(() => {
    navigate('Password');
  }, [navigate]);

  return (
    <Layout>
      <VStack>
        <BackButton mb='10px' onPress={onBack} />
        <VStack>
          <Text fontSize='3xl'>
            Reset <Text fontWeight='bold'>Wallet</Text>
          </Text>
          <VStack
            rounded='xl'
            bg='rose.100'
            alignItems='flex-start'
            p='14px'
            borderWidth='1'
            borderColor='rose.500'
            mt='8px'
          >
            <Box bg='rose.500' p='6px' rounded='xl' mb='10px'>
              <Icon as={CgDanger} bg='white' />
            </Box>
            <Text color='gray.500' fontSize='11px'>
              Mydogemask does not keep a copy of your password. If you’re having
              trouble unlocking your account, you will need to reset your
              wallet. You can do this by providing the 12-word Seed Phrase.{' '}
              <Text fontWeight='bold'>
                This action will delete your current wallet and Seed Phrase from
                this device. You will not be able to undo this.
              </Text>
            </Text>
          </VStack>
          <WalletRestore confirmBefore onRestoreComplete={onRestoreComplete} />
        </VStack>
      </VStack>
    </Layout>
  );
};
