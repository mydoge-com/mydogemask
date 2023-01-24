import {
  AlertDialog,
  Avatar,
  Badge,
  Box,
  Button,
  Divider,
  HStack,
  Pressable,
  Text,
  // Toast,
  VStack,
} from 'native-base';
import { Fragment, useCallback, useRef, useState } from 'react';
import { FaLink } from 'react-icons/fa';
import { FiCheck } from 'react-icons/fi';
import sb from 'satoshi-bitcoin';

import { BigButton } from '../../components/Button';
import { Layout } from '../../components/Layout';
// import { ToastRender } from '../../components/ToastRender';
import { useAppContext } from '../../hooks/useAppContext';
import { useInterval } from '../../hooks/useInterval';
import { MESSAGE_TYPES } from '../../scripts/helpers/constants';
import { sendMessage } from '../../scripts/helpers/message';

const REFRESH_INTERVAL = 10000;

export function Connect() {
  const {
    connectionRequest: { originTabId, origin },
    wallet,
  } = useAppContext();

  const [addressBalances, setAddressBalances] = useState([]);
  const [selectedAddressIndex, setSelectedAddressIndex] = useState(0);

  const getBalances = useCallback(() => {
    sendMessage(
      {
        message: MESSAGE_TYPES.GET_ADDRESS_BALANCE,
        data: { addresses: wallet.addresses },
      },
      (balances) => {
        if (balances) {
          setAddressBalances(balances);
        }
      }
    );
  }, [wallet.addresses]);

  useInterval(getBalances, REFRESH_INTERVAL, true);

  const onSelectAddress = useCallback((index) => {
    setSelectedAddressIndex(index);
  }, []);

  const [confirmationModalOpen, setConfirmationModalOpen] = useState(false);
  const onCloseModal = useCallback(() => {
    setConfirmationModalOpen(false);
  }, []);
  return (
    <Layout pt='32px' alignItems='center'>
      <Badge
        px='20px'
        py='4px'
        colorScheme='gray'
        rounded='full'
        _text={{ fontSize: '14px' }}
      >
        {origin}
      </Badge>
      <Box p='8px' bg='brandYellow.500' rounded='full' my='16px'>
        <FaLink />
      </Box>
      <Text fontSize='2xl' pb='6px'>
        Connect with <Text fontWeight='bold'>MyDogeMask</Text>
      </Text>
      <Text fontSize='sm' color='gray.600'>
        Select the address you want to use with this site
      </Text>
      <VStack
        style={{
          scrollbarWidth: 'none',
        }}
        mt='20px'
        flexShrink={1}
        overflowY='scroll'
      >
        {wallet.addresses.map((address, i) => {
          return (
            <Box key={address}>
              <Pressable
                px='12px'
                onPress={() => onSelectAddress(i)}
                _hover={{
                  bg: 'rgba(0,0,0, 0.1)',
                }}
                py='6px'
              >
                <HStack alignItems='center'>
                  <Box w='30px'>
                    {i === selectedAddressIndex ? (
                      <FiCheck color='#54a937' size='26px' />
                    ) : null}
                  </Box>
                  <Avatar
                    source={{
                      uri: '/assets/default-avatar.png',
                    }}
                    size='28px'
                    mr='12px'
                  />
                  <VStack>
                    <HStack alignItems='center'>
                      <Text fontSize='sm' fontWeight='medium'>
                        Address {i + 1}
                      </Text>
                      <Text fontSize='sm' color='gray.500'>
                        {' '}
                        ({address.slice(0, 8)}...{address.slice(-4)})
                      </Text>
                    </HStack>
                    <Text color='gray.400' fontSize='xs'>
                      {addressBalances[i] ? (
                        <>
                          <Text fontWeight='bold'>Balance: </Text>Ð
                          {sb.toBitcoin(addressBalances[i])}
                        </>
                      ) : (
                        ' '
                      )}
                    </Text>
                  </VStack>
                </HStack>
              </Pressable>
              <Divider />
            </Box>
          );
        })}
      </VStack>
      <BigButton
        onPress={() => setConfirmationModalOpen(true)}
        mb='20px'
        mt='16px'
      >
        Connect
      </BigButton>
      <ConfirmationModal
        showModal={confirmationModalOpen}
        onClose={onCloseModal}
        origin={origin}
        originTabId={originTabId}
      />
    </Layout>
  );
}

const ConfirmationModal = ({
  showModal,
  onClose,
  selectedAddressIndex,
  origin,
  originTabId,
}) => {
  const cancelRef = useRef();
  const onConnect = useCallback(() => {
    sendMessage(
      {
        message: MESSAGE_TYPES.APPROVE_CONNECTION,
        data: { approved: true, selectedAddressIndex, originTabId, origin },
      },
      (response) => {
        if (response) {
          console.log({ response });
          // onClose?.();
          // Toast.show({
          //   duration: 3000,
          //   render: () => {
          //     return (
          //       <ToastRender description='Address deleted' status='info' />
          //     );
          //   },
          // });
        } else {
          // Toast.show({
          //   duration: 3000,
          //   render: () => {
          //     return (
          //       <ToastRender
          //         title='Error'
          //         description='There was an error deleting the address'
          //         status='error'
          //       />
          //     );
          //   },
          // });
        }
      },
      []
    );
  }, [origin, selectedAddressIndex, originTabId]);

  const onCancel = useCallback(() => {
    onClose();
    sendMessage(
      {
        message: MESSAGE_TYPES.APPROVE_CONNECTION,
        data: { approved: false },
      },
      (response) => {
        if (response) {
          console.log({ response });
          // onClose?.();
          // Toast.show({
          //   duration: 3000,
          //   render: () => {
          //     return (
          //       <ToastRender description='Address deleted' status='info' />
          //     );
          //   },
          // });
        } else {
          // Toast.show({
          //   duration: 3000,
          //   render: () => {
          //     return (
          //       <ToastRender
          //         title='Error'
          //         description='There was an error deleting the address'
          //         status='error'
          //       />
          //     );
          //   },
          // });
        }
      },
      []
    );
  }, [onClose]);

  return (
    <AlertDialog
      leastDestructiveRef={cancelRef}
      isOpen={showModal}
      onClose={onClose}
    >
      <AlertDialog.Content>
        <AlertDialog.CloseButton />
        <AlertDialog.Header>Connect Wallet</AlertDialog.Header>
        <AlertDialog.Body>
          <Badge
            px='10px'
            py='4px'
            mb='8px'
            bg='gray.200'
            rounded='full'
            _text={{ fontSize: '13px' }}
            alignSelf='center'
          >
            {origin}
          </Badge>
          Allow this website be see your address, account balance, activity and
          suggest transactions to approve?
        </AlertDialog.Body>
        <AlertDialog.Footer>
          <Button.Group space={2}>
            <Button
              variant='unstyled'
              colorScheme='coolGray'
              onPress={onCancel}
              ref={cancelRef}
            >
              Cancel
            </Button>
            <BigButton onPress={onConnect} px='24px'>
              Connect
            </BigButton>
          </Button.Group>
        </AlertDialog.Footer>
      </AlertDialog.Content>
    </AlertDialog>
  );
};
