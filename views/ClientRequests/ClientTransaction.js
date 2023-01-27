import {
  AlertDialog,
  Avatar,
  Badge,
  Box,
  Button,
  Center,
  HStack,
  Modal,
  Spinner,
  Text,
  Toast,
} from 'native-base';
import { useCallback, useEffect, useRef, useState } from 'react';
import { FaLink } from 'react-icons/fa';

import { BigButton } from '../../components/Button';
import { Layout } from '../../components/Layout';
import { ToastRender } from '../../components/ToastRender';
import { DISPATCH_TYPES } from '../../Context';
import { useAppContext } from '../../hooks/useAppContext';
import { MESSAGE_TYPES } from '../../scripts/helpers/constants';
import { getConnectedAddressIndex } from '../../scripts/helpers/data';
import { sendMessage } from '../../scripts/helpers/message';

export function ClientTransaction() {
  const {
    clientRequest: {
      params: { originTabId, origin, recipientAddress, dogeAmount, rawTx, fee },
    },
    wallet,
    dispatch,
  } = useAppContext();

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
                description={`MyDogeMask failed to authorize the transaction to ${origin}`}
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
        <Badge
          px='12px'
          py='2px'
          mt='12px'
          mb='6px'
          colorScheme='gray'
          rounded='full'
          _text={{ fontSize: '14px' }}
        >
          {origin}
        </Badge>
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
      />
    </Layout>
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
        setLoading(false);
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
                      description={`Sent Transaction: ${txId}`}
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
            Allow this website be see your address, account balance, activity
            and suggest transactions to approve?
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
                Connect
              </BigButton>
            </Button.Group>
          </AlertDialog.Footer>
        </AlertDialog.Content>
      </AlertDialog>
    </>
  );
};
