import {
  AlertDialog,
  Avatar,
  Box,
  Button,
  Center,
  HStack,
  Modal,
  Spinner,
  Text,
  Toast,
  VStack,
} from 'native-base';
import { useCallback, useEffect, useRef, useState } from 'react';
import { FaLink } from 'react-icons/fa';

import { BigButton } from '../../components/Button';
import { OriginBadge } from '../../components/OriginBadge';
import { ToastRender } from '../../components/ToastRender';
import { DISPATCH_TYPES } from '../../Context';
import { MESSAGE_TYPES } from '../../scripts/helpers/constants';
import { getConnectedAddressIndex } from '../../scripts/helpers/data';
import { sendMessage } from '../../scripts/helpers/message';

export function ClientDoginalTransaction({ params, wallet, dispatch }) {
  const { originTabId, origin, recipientAddress, dogeAmount, rawTx, fee } =
    params;

  const handleWindowClose = useCallback(() => {
    dispatch({ type: DISPATCH_TYPES.CLEAR_CLIENT_REQUEST });
  }, [dispatch]);

  const [addressIndex, setAddressIndex] = useState();

  useEffect(() => {
    getConnectedAddressIndex(origin).then((index) => {
      setAddressIndex(index);
    });
  }, [origin]);

  const senderAddress = wallet.addresses[addressIndex];

  const [confirmationModalOpen, setConfirmationModalOpen] = useState(false);
  const onCloseModal = useCallback(() => {
    setConfirmationModalOpen(false);
  }, []);

  const onRejectTransaction = useCallback(() => {
    sendMessage(
      {
        message: MESSAGE_TYPES.CLIENT_REQUEST_TRANSACTION_RESPONSE,
        data: { error: 'User refused transaction', originTabId, origin },
      },
      () => {
        Toast.show({
          duration: 3000,
          render: () => {
            return (
              <ToastRender
                title='Transaction Rejected'
                description={`MyDoge failed to authorize the transaction to ${origin}`}
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

  return (
    <>
      <Box p='8px' bg='brandYellow.500' rounded='full' my='16px'>
        <FaLink />
      </Box>
      <Text fontSize='2xl'>
        Confirm <Text fontWeight='bold'>Transaction</Text>
      </Text>
      <Center pt='36px'>
        <Text fontSize='sm' color='gray.500' textAlign='center' mb='20px'>
          <Text fontWeight='semibold' bg='gray.100' px='6px' rounded='md'>
            Wallet {addressIndex + 1}
          </Text>
          {'  '}
          {senderAddress?.slice(0, 8)}...{senderAddress?.slice(-4)}
        </Text>
        <Text fontSize='lg' pb='4px' textAlign='center' fontWeight='semibold'>
          Paying
        </Text>
        <OriginBadge origin={origin} mb='6px' mt='12px' />
        <HStack alignItems='center' space='12px' pb='28px'>
          <Avatar size='sm' bg='brandYellow.500' _text={{ color: 'gray.800' }}>
            {recipientAddress.substring(0, 2)}
          </Avatar>
          <Text
            fontSize='md'
            fontWeight='semibold'
            color='gray.500'
            textAlign='center'
          >
            {recipientAddress.slice(0, 8)}...{recipientAddress.slice(-4)}
          </Text>
        </HStack>
        <Text fontSize='3xl' fontWeight='semibold' pt='6px'>
          Ð{dogeAmount}
        </Text>
        <Text fontSize='13px' fontWeight='semibold' pt='6px'>
          Network fee Ð{fee}
        </Text>
        <HStack alignItems='center' mt='60px' space='12px'>
          <BigButton
            onPress={onRejectTransaction}
            variant='secondary'
            px='20px'
          >
            Cancel
          </BigButton>
          <BigButton
            onPress={() => setConfirmationModalOpen(true)}
            type='submit'
            role='button'
            px='28px'
          >
            Pay
          </BigButton>
        </HStack>
      </Center>
      <ConfirmationModal
        showModal={confirmationModalOpen}
        onClose={onCloseModal}
        origin={origin}
        originTabId={originTabId}
        rawTx={rawTx}
        addressIndex={addressIndex}
        handleWindowClose={handleWindowClose}
        recipientAddress={recipientAddress}
        dogeAmount={dogeAmount}
      />
    </>
  );
}

const ConfirmationModal = ({
  showModal,
  onClose,
  origin,
  rawTx,
  addressIndex,
  originTabId,
  handleWindowClose,
  recipientAddress,
  dogeAmount,
}) => {
  const cancelRef = useRef();
  const [loading, setLoading] = useState(false);

  const onSubmit = useCallback(async () => {
    setLoading(true);
    sendMessage(
      {
        message: 'sendTransaction',
        data: { rawTx, selectedAddressIndex: addressIndex },
      },
      (txId) => {
        if (txId) {
          sendMessage(
            {
              message: MESSAGE_TYPES.CLIENT_REQUEST_TRANSACTION_RESPONSE,
              data: { txId, originTabId, origin },
            },
            () => {
              Toast.show({
                duration: 3000,
                render: () => {
                  return (
                    <ToastRender
                      description='Transaction Sent'
                      status='success'
                    />
                  );
                },
              });
              handleWindowClose();
            }
          );
        } else {
          sendMessage(
            {
              message: MESSAGE_TYPES.CLIENT_REQUEST_TRANSACTION_RESPONSE,
              data: {
                error: 'Failed to send transaction',
                originTabId,
                origin,
              },
            },
            () => {
              Toast.show({
                title: 'Error',
                description: 'Transaction Failed',
                duration: 3000,
                render: () => {
                  return (
                    <ToastRender
                      title='Error'
                      description='Failed to send transaction.'
                      status='error'
                    />
                  );
                },
              });
              handleWindowClose();
            }
          );
        }
      }
    );
  }, [addressIndex, handleWindowClose, origin, originTabId, rawTx]);

  return (
    <>
      <Modal isOpen={loading} full>
        <Modal.Body h='600px' justifyContent='center'>
          <Spinner size='lg' />
        </Modal.Body>
      </Modal>
      <AlertDialog
        leastDestructiveRef={cancelRef}
        isOpen={showModal}
        onClose={onClose}
      >
        <AlertDialog.Content>
          <AlertDialog.CloseButton />
          <AlertDialog.Header>Confirm Transaction</AlertDialog.Header>
          <AlertDialog.Body>
            <OriginBadge origin={origin} mb='8px' />
            <VStack alignItems='center'>
              <Text>
                Confirm transaction to send{' '}
                <Text fontWeight='bold'>Ð{dogeAmount}</Text> to{' '}
              </Text>
              <Text fontSize='10px' fontWeight='bold'>
                {recipientAddress}
              </Text>
            </VStack>
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
              <BigButton onPress={onSubmit} px='24px'>
                Confirm
              </BigButton>
            </Button.Group>
          </AlertDialog.Footer>
        </AlertDialog.Content>
      </AlertDialog>
    </>
  );
};
