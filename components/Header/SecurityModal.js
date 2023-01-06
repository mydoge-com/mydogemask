import { AlertDialog, Button, Divider, Modal, Text, VStack } from 'native-base';
import { useCallback, useRef, useState } from 'react';

import { useAppContext } from '../../hooks/useAppContext';
import { sendMessage } from '../../scripts/helpers/message';
import { BigButton } from '../Button';

export const SecurityModal = ({ showModal, onClose }) => {
  const { dispatch } = useAppContext();
  const onDeleteWallet = useCallback(() => {
    sendMessage({ message: 'deleteWallet' }, () => {
      dispatch({ type: 'SIGN_OUT', payload: { navigate: 'Intro' } });
    });
  }, [dispatch]);
  const [deleteDialogIsOpen, setDeleteDialogIsOpen] = useState(false);
  return (
    <Modal isOpen={showModal} onClose={onClose} size='full'>
      <Modal.Content h='100%' w='100%' rounded={0}>
        <Modal.CloseButton />
        <Modal.Body alignItems='center' pt='42px'>
          <Section
            title='Backup wallet'
            body='Erase the current wallet from this device'
            buttonVariant='secondary'
          />
          <Divider width='100%' my='30px' />
          <Section
            title='Delete wallet'
            body='Erase the current wallet from this device'
            buttonVariant='danger'
            action={() => setDeleteDialogIsOpen(true)}
          />
          <DeleteWalletAlert
            isOpen={deleteDialogIsOpen}
            onClose={() => setDeleteDialogIsOpen(false)}
            onConfirm={onDeleteWallet}
          />
        </Modal.Body>
      </Modal.Content>
    </Modal>
  );
};

const Section = ({
  title,
  body,
  buttonLabel,
  buttonVariant = 'primary',
  action,
}) => {
  return (
    <VStack w='100%'>
      <Text fontSize='lg' fontWeight='medium' pb='4px'>
        {title}
      </Text>
      <Text>{body}</Text>
      <BigButton
        variant={buttonVariant}
        alignSelf='flex-start'
        mt='18px'
        px='24px'
        onPress={action}
      >
        {buttonLabel ?? title}
      </BigButton>
    </VStack>
  );
};

const DeleteWalletAlert = ({ isOpen, onClose, onConfirm }) => {
  const cancelRef = useRef();
  return (
    <AlertDialog
      leastDestructiveRef={cancelRef}
      isOpen={isOpen}
      onClose={onClose}
    >
      <AlertDialog.Content>
        <AlertDialog.CloseButton />
        <AlertDialog.Header>Delete wallet</AlertDialog.Header>
        <AlertDialog.Body>
          This will delete your current wallet and Seed Phrase from this device.
          Make sure you have your Seed Phrase backed up or you will lose access
          to your Dogecoin!
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
            <BigButton variant='danger' onPress={onConfirm} px='24px'>
              Delete
            </BigButton>
          </Button.Group>
        </AlertDialog.Footer>
      </AlertDialog.Content>
    </AlertDialog>
  );
};
