import {
  AlertDialog,
  Box,
  Button,
  Center,
  HStack,
  Modal,
  Spinner,
  Text,
  VStack,
} from 'native-base';
import { useCallback, useRef, useState } from 'react';
import { FaLink } from 'react-icons/fa';

import { BigButton } from '../../components/Button';
import { OriginBadge } from '../../components/OriginBadge';
import { WalletAddress } from '../../components/WalletAddress';
import { MESSAGE_TYPES } from '../../scripts/helpers/constants';
import { sendMessage } from '../../scripts/helpers/message';

export function ClientDecryptedMessage({
  params,
  connectedClient,
  connectedAddressIndex: addressIndex,
  handleResponse,
}) {
  const { originTabId, origin, message } = params;

  const [confirmationModalOpen, setConfirmationModalOpen] = useState(false);
  const onCloseModal = useCallback(() => {
    setConfirmationModalOpen(false);
  }, []);

  const onRejectTransaction = useCallback(() => {
    handleResponse({
      toastMessage: 'Message Rejected',
      toastTitle: 'Error',
      error: 'User refused decrypted message',
    });
  }, [handleResponse]);

  return (
    <>
      <Box p='8px' bg='brandYellow.500' rounded='full' my='16px'>
        <FaLink />
      </Box>
      <Text fontSize='2xl'>
        Confirm <Text fontWeight='bold'>Decrypted Message</Text>
      </Text>
      <Center pt='16px' width='80%'>
        <WalletAddress address={connectedClient.address} />
        <Text fontSize='lg' pb='4px' textAlign='center' fontWeight='semibold'>
          Decrypting
        </Text>
        <OriginBadge origin={origin} mt='12px' mb='20px' />
        <Text
          fontWeight='semibold'
          pt='6px'
          adjustsFontSizeToFit
          numberOfLines={1}
        >
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
        handleResponse={handleResponse}
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
  handleResponse,
}) => {
  const cancelRef = useRef();
  const [loading, setLoading] = useState(false);

  const handleClose = useCallback(() => {
    setLoading(false);
    onClose();
  }, [onClose]);

  const onSubmit = useCallback(async () => {
    setLoading(true);
    sendMessage(
      {
        message: MESSAGE_TYPES.DECRYPT_MESSAGE,
        data: { message, selectedAddressIndex: addressIndex },
      },
      (decryptedMessage) => {
        if (decryptedMessage) {
          handleResponse({
            toastMessage: 'Message Decrypted Successfully',
            toastTitle: 'Success',
            data: { decryptedMessage },
          });
        } else {
          handleResponse({
            toastMessage: 'Message Decrypting Failed',
            toastTitle: 'Error',
            error: 'Failed to decrypt message',
          });
        }
      }
    );
  }, [message, addressIndex, handleResponse]);

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
        onClose={handleClose}
      >
        <AlertDialog.Content>
          <AlertDialog.CloseButton />
          <AlertDialog.Header>Confirm Transaction</AlertDialog.Header>
          <AlertDialog.Body>
            <OriginBadge origin={origin} mb='8px' />
            <VStack alignItems='center'>
              <Text adjustsFontSizeToFit numberOfLines={2}>
                Confirm message to decrypt{' '}
                <Text fontWeight='bold'>{message}</Text>
              </Text>
            </VStack>
          </AlertDialog.Body>
          <AlertDialog.Footer>
            <Button.Group space={2}>
              <Button
                variant='unstyled'
                colorScheme='coolGray'
                onPress={handleClose}
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
