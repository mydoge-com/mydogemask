import {
  AlertDialog,
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
import { useCallback, useRef, useState } from 'react';
import { FaLink } from 'react-icons/fa';

import { BigButton } from '../../components/Button';
import { OriginBadge } from '../../components/OriginBadge';
import { ToastRender } from '../../components/ToastRender';
import { WalletAddress } from '../../components/WalletAddress';
import { DISPATCH_TYPES } from '../../Context';
import { MESSAGE_TYPES } from '../../scripts/helpers/constants';
import { sendMessage } from '../../scripts/helpers/message';

export function ClientDecryptedMessage({
  params,
  dispatch,
  connectedClient,
  connectedAddressIndex: addressIndex,
}) {
  const { originTabId, origin, message } = params;

  const handleWindowClose = useCallback(() => {
    dispatch({ type: DISPATCH_TYPES.CLEAR_CLIENT_REQUEST });
  }, [dispatch]);

  const [confirmationModalOpen, setConfirmationModalOpen] = useState(false);
  const onCloseModal = useCallback(() => {
    setConfirmationModalOpen(false);
  }, []);

  const onRejectTransaction = useCallback(() => {
    sendMessage(
      {
        message: MESSAGE_TYPES.CLIENT_REQUEST_DECRYPTED_MESSAGE_RESPONSE,
        data: { error: 'User refused decrypted message', originTabId, origin },
      },
      () => {
        Toast.show({
          duration: 3000,
          render: () => {
            return (
              <ToastRender
                title='Message Rejected'
                description={`MyDoge failed to authorize the decrypted message request to ${origin}`}
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
        Confirm <Text fontWeight='bold'>Decrypted Message</Text>
      </Text>
      <Center pt='16px'>
        <WalletAddress address={connectedClient.address} />
        <Text fontSize='lg' pb='4px' textAlign='center' fontWeight='semibold'>
          Signing
        </Text>
        <OriginBadge origin={origin} mt='12px' mb='20px' />
        <Text fontSize='3xl' fontWeight='semibold' pt='6px'>
          {message}
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
            Decrypt
          </BigButton>
        </HStack>
      </Center>
      <ConfirmationModal
        showModal={confirmationModalOpen}
        onClose={onCloseModal}
        origin={origin}
        originTabId={originTabId}
        message={message}
        addressIndex={addressIndex}
        handleWindowClose={handleWindowClose}
      />
    </>
  );
}

const ConfirmationModal = ({
  showModal,
  onClose,
  origin,
  message,
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
        message: MESSAGE_TYPES.DECRYPT_MESSAGE,
        data: { message, selectedAddressIndex: addressIndex },
      },
      (decryptedMessage) => {
        if (decryptedMessage) {
          sendMessage(
            {
              message: MESSAGE_TYPES.CLIENT_REQUEST_DECRYPTED_MESSAGE_RESPONSE,
              data: { decryptedMessage, originTabId, origin },
            },
            () => {
              Toast.show({
                duration: 3000,
                render: () => {
                  return (
                    <ToastRender
                      description='Message Decrypted Successfully'
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
              message: MESSAGE_TYPES.CLIENT_REQUEST_DECRYPTED_MESSAGE_RESPONSE,
              data: {
                error: 'Failed to decrypt message',
                originTabId,
                origin,
              },
            },
            () => {
              Toast.show({
                title: 'Error',
                description: 'Message Signing Failed',
                duration: 3000,
                render: () => {
                  return (
                    <ToastRender
                      title='Error'
                      description='Failed to decrypt message.'
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
  }, [addressIndex, handleWindowClose, origin, originTabId, message]);

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
                Confirm message to decrypt{' '}
                <Text fontWeight='bold'>{message}</Text> to{' '}
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
