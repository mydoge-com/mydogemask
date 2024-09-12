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

export function ClientSignedMessage({
  params,
  connectedClient,
  connectedAddressIndex: addressIndex,
  handleResponse,
}) {
  const { origin, message } = params;

  const [confirmationModalOpen, setConfirmationModalOpen] = useState(false);
  const onCloseModal = useCallback(() => {
    setConfirmationModalOpen(false);
  }, []);

  const onRejectTransaction = useCallback(() => {
    handleResponse({
      toastMessage: `MyDoge failed to authorize the signed message request to ${origin}`,
      toastTitle: 'Message Rejected',
      error: 'User refused signed message',
    });
  }, [handleResponse, origin]);

  return (
    <>
      <Box p='8px' bg='brandYellow.500' rounded='full' my='16px'>
        <FaLink />
      </Box>
      <Text fontSize='2xl'>
        Confirm <Text fontWeight='bold'>Signed Message</Text>
      </Text>
      <Center pt='16px' width='80%'>
        <WalletAddress address={connectedClient.address} />
        <Text fontSize='lg' pb='4px' textAlign='center' fontWeight='semibold'>
          Signing
        </Text>
        <OriginBadge origin={origin} mt='12px' mb='20px' />
        <Text
          fontWeight='semibold'
          pt='6px'
          px='12px'
          adjustsFontSizeToFit
          numberOfLines={4}
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
            Sign
          </BigButton>
        </HStack>
      </Center>
      <ConfirmationModal
        showModal={confirmationModalOpen}
        onClose={onCloseModal}
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
  message,
  addressIndex,
  handleResponse,
}) => {
  const cancelRef = useRef();
  const [loading, setLoading] = useState(false);

  const onSubmit = useCallback(async () => {
    setLoading(true);
    sendMessage(
      {
        message: MESSAGE_TYPES.SIGN_MESSAGE,
        data: { message, selectedAddressIndex: addressIndex },
      },
      (signedMessage) => {
        if (signedMessage) {
          handleResponse({
            toastMessage: 'Message Signed Successfully',
            toastTitle: 'Message Signed',
            data: { signedMessage },
          });
        } else {
          handleResponse({
            toastMessage: 'Message Signing Failed',
            toastTitle: 'Error',
            error: 'Failed to sign message',
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
        onClose={onClose}
      >
        <AlertDialog.Content>
          <AlertDialog.CloseButton />
          <AlertDialog.Header>Confirm Transaction</AlertDialog.Header>
          <AlertDialog.Body>
            <OriginBadge origin={origin} mb='8px' />
            <VStack alignItems='center'>
              <Text adjustsFontSizeToFit numberOfLines={2}>
                Confirm message to sign <Text fontWeight='bold'>{message}</Text>
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
