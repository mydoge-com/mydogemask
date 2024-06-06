import {
  AlertDialog,
  Avatar,
  Box,
  Button,
  Divider,
  HStack,
  Pressable,
  Text,
  Toast,
  VStack,
} from 'native-base';
import { useCallback, useRef, useState } from 'react';
import { FaLink } from 'react-icons/fa';
import { FiCheck } from 'react-icons/fi';
import sb from 'satoshi-bitcoin';

import { BigButton } from '../../components/Button';
import { Layout } from '../../components/Layout';
import { OriginBadge } from '../../components/OriginBadge';
import { ToastRender } from '../../components/ToastRender';
import { DISPATCH_TYPES } from '../../Context';
import { useAppContext } from '../../hooks/useAppContext';
import { useInterval } from '../../hooks/useInterval';
import { MESSAGE_TYPES } from '../../scripts/helpers/constants';
import { sendMessage } from '../../scripts/helpers/message';

const REFRESH_INTERVAL = 10000;

export function ClientConnect() {
  const {
    clientRequest: {
      params: { originTabId, origin },
    },
    wallet,
    dispatch,
  } = useAppContext();

  const handleWindowClose = useCallback(() => {
    dispatch({ type: DISPATCH_TYPES.CLEAR_CLIENT_REQUEST });
  }, [dispatch]);

  const onRejectConnection = useCallback(() => {
    sendMessage(
      {
        message: MESSAGE_TYPES.CLIENT_REQUEST_CONNECTION_RESPONSE,
        data: { approved: false, originTabId, origin },
      },
      () => {
        Toast.show({
          duration: 3000,
          render: () => {
            return (
              <ToastRender
                title='Connection Failed'
                description={`MyDoge failed to connected to ${origin}`}
                status='error'
              />
            );
          },
        });
        handleWindowClose();
      },
      []
    );
  }, [handleWindowClose, origin, originTabId]);

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
      <OriginBadge origin={origin} />

      <Box p='8px' bg='brandYellow.500' rounded='full' my='16px'>
        <FaLink />
      </Box>
      <Text fontSize='2xl' pb='6px'>
        Connect with <Text fontWeight='bold'>MyDoge</Text>
      </Text>
      <Text fontSize='sm' color='gray.600'>
        Select the address you want to use with this site
      </Text>
      <VStack justifyContent='space-between' flex={1}>
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
        <HStack mb='20px' mt='20px' justifyContent='center' space='12px'>
          <BigButton onPress={onRejectConnection} variant='secondary' px='20px'>
            Cancel
          </BigButton>
          <BigButton
            onPress={() => setConfirmationModalOpen(true)}
            px='20px'
            isDisabled={!addressBalances.length}
          >
            Connect
          </BigButton>
        </HStack>
      </VStack>
      <ConfirmationModal
        showModal={confirmationModalOpen}
        onClose={onCloseModal}
        origin={origin}
        originTabId={originTabId}
        selectedAddress={wallet.addresses[selectedAddressIndex]}
        balance={addressBalances[selectedAddressIndex]}
        handleWindowClose={handleWindowClose}
      />
    </Layout>
  );
}

const ConfirmationModal = ({
  showModal,
  onClose,
  selectedAddress,
  origin,
  originTabId,
  balance,
  handleWindowClose,
}) => {
  const cancelRef = useRef();
  const onConnect = useCallback(() => {
    sendMessage(
      {
        message: MESSAGE_TYPES.CLIENT_REQUEST_CONNECTION_RESPONSE,
        data: {
          approved: true,
          address: selectedAddress,
          balance,
          originTabId,
          origin,
        },
      },
      (response) => {
        if (response) {
          onClose?.();
          Toast.show({
            duration: 3000,
            render: () => {
              return (
                <ToastRender
                  title='Connection Success'
                  description={`MyDoge has connected to ${origin}`}
                  status='success'
                />
              );
            },
          });
          handleWindowClose();
        }
      },
      []
    );
  }, [
    selectedAddress,
    balance,
    originTabId,
    origin,
    onClose,
    handleWindowClose,
  ]);

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
          <OriginBadge origin={origin} mb='12px' />
          Allow this website be see your address, account balance, activity and
          suggest transactions to approve?
        </AlertDialog.Body>
        <AlertDialog.Footer>
          <Button.Group space={2}>
            <Button
              variant='unstyled'
              colorScheme='coolGray'
              onPress={onClose}
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
