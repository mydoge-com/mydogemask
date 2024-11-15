import {
  AlertDialog,
  Avatar,
  Box,
  Button,
  Divider,
  HStack,
  Pressable,
  Text,
  VStack,
} from 'native-base';
import { useCallback, useRef, useState } from 'react';
import { FaLink } from 'react-icons/fa';
import { FiCheck } from 'react-icons/fi';
import sb from 'satoshi-bitcoin';

import { BigButton } from '../../components/Button';
import { OriginBadge } from '../../components/OriginBadge';
import { useInterval } from '../../hooks/useInterval';
import { MESSAGE_TYPES } from '../../scripts/helpers/constants';
import { sendMessage } from '../../scripts/helpers/message';

const REFRESH_INTERVAL = 10000;

export function ClientConnect({ params, wallet, handleResponse }) {
  const { origin, originTabId } = params ?? {};

  const onRejectConnection = useCallback(() => {
    handleResponse({
      toastMessage: `MyDoge failed to connected to ${origin}`,
      toastTitle: 'Connection Failed',
      error: 'Unable to connect to MyDoge',
    });
  }, [handleResponse, origin, originTabId]);

  const [addressBalances, setAddressBalances] = useState({});
  const [selectedAddressIndex, setSelectedAddressIndex] = useState(0);

  const getBalances = useCallback(() => {
    wallet.addresses.forEach((address) => {
      sendMessage(
        {
          message: MESSAGE_TYPES.GET_ADDRESS_BALANCE,
          data: { address },
        },
        (response) => {
          setAddressBalances((prev) => ({
            ...prev,
            [address]: response,
          }));
        }
      );
    });
  }, [wallet.addresses]);

  useInterval(getBalances, REFRESH_INTERVAL, true);

  const onSelectAddress = useCallback((index) => {
    setSelectedAddressIndex(index);
  }, []);

  const [confirmationModalOpen, setConfirmationModalOpen] = useState(false);
  const onCloseModal = useCallback(() => {
    setConfirmationModalOpen(false);
  }, []);

  const selectedAddress = wallet.addresses[selectedAddressIndex];
  const selectedAddressBalance = addressBalances[selectedAddress];

  return (
    <>
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
                          {wallet.nicknames?.[address] ?? `Address ${i + 1}`}
                        </Text>
                      </HStack>
                      <Text color='gray.400' fontSize='xs'>
                        {addressBalances[address] ? (
                          <>
                            <Text fontWeight='bold'>Balance: </Text>Ð
                            {sb.toBitcoin(addressBalances[address])}
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
            isDisabled={!selectedAddressBalance}
          >
            Connect
          </BigButton>
        </HStack>
      </VStack>
      <ConfirmationModal
        showModal={confirmationModalOpen}
        onClose={onCloseModal}
        selectedAddressIndex={selectedAddressIndex}
        selectedAddress={selectedAddress}
        balance={selectedAddressBalance}
        handleResponse={handleResponse}
        origin={origin}
      />
    </>
  );
}

const ConfirmationModal = ({
  showModal,
  onClose,
  selectedAddress,
  selectedAddressIndex,
  balance,
  handleResponse,
  origin,
}) => {
  const cancelRef = useRef();
  const onConnect = useCallback(() => {
    handleResponse({
      toastMessage: `MyDoge has connected to ${origin}`,
      toastTitle: 'Connection Success',
      data: {
        approved: true,
        address: selectedAddress,
        selectedAddressIndex,
        balance,
      },
    });
  }, [handleResponse, selectedAddress, selectedAddressIndex, balance]);

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
