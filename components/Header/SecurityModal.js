import {
  AlertDialog,
  Box,
  Button,
  Divider,
  Modal,
  Text,
  VStack,
} from 'native-base';
import { useCallback, useRef, useState } from 'react';
import { FiCopy } from 'react-icons/fi';

import { useAppContext } from '../../hooks/useAppContext';
import { useAuth } from '../../hooks/useAuth';
import { useCopyText } from '../../hooks/useCopyText';
import { sendMessage } from '../../scripts/helpers/message';
import { BigButton } from '../Button';

export const SecurityModal = ({ showModal, onClose }) => {
  return (
    <Modal isOpen={showModal} onClose={onClose} size='full'>
      <Modal.Content w='100%'>
        <Modal.CloseButton />
        <Modal.Body alignItems='center' pt='54px' pb='36px'>
          <BackupWallet />
          <Divider width='100%' my='30px' />
          <DeleteWallet />
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

const DeleteWallet = () => {
  const { dispatch } = useAppContext();
  const [isOpen, setIsOpen] = useState(false);
  const onClose = useCallback(() => setIsOpen(false), []);
  const cancelRef = useRef();

  const onConfirm = useCallback(() => {
    sendMessage({ message: 'deleteWallet' }, () => {
      dispatch({ type: 'SIGN_OUT', payload: { navigate: 'Intro' } });
    });
  }, [dispatch]);
  return (
    <>
      <Section
        title='Delete wallet'
        body='Erase the current wallet from this device.'
        buttonVariant='danger'
        action={() => setIsOpen(true)}
      />
      <AlertDialog
        leastDestructiveRef={cancelRef}
        isOpen={isOpen}
        onClose={onClose}
      >
        <AlertDialog.Content>
          <AlertDialog.CloseButton />
          <AlertDialog.Header>Delete wallet</AlertDialog.Header>
          <AlertDialog.Body>
            This will delete your current wallet and Seed Phrase from this
            device. Make sure you have your Seed Phrase backed up or you will
            lose access to your Dogecoin!
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
    </>
  );
};

const BackupWallet = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [phrase, setPhrase] = useState('');
  const onClose = useCallback(() => {
    setIsOpen(false);
    setTimeout(() => setPhrase(''));
  }, []);
  const cancelRef = useRef();

  const { copyTextToClipboard, textCopied } = useCopyText({ text: phrase });

  const onConfirm = useCallback(({ wallet }) => {
    setPhrase(wallet.phrase);
  }, []);

  const { renderPasswordInput, onSubmit, password } = useAuth({
    onValidAuth: onConfirm,
  });
  return (
    <>
      <Section
        title='Backup wallet'
        body='Backup your Seed Phrase. You can back it up by writing it down and storing it somewhere safe, or by using a password manager.'
        buttonLabel='Backup wallet'
        buttonVariant='secondary'
        action={() => setIsOpen(true)}
      />
      <AlertDialog
        leastDestructiveRef={cancelRef}
        isOpen={isOpen}
        onClose={onClose}
      >
        <AlertDialog.Content>
          <AlertDialog.CloseButton />
          {!phrase ? (
            <>
              <AlertDialog.Header>Backup Seed Phrase</AlertDialog.Header>
              <AlertDialog.Body>
                <Text>
                  If you ever change browsers or move computers, you will need
                  this Seed Phrase to access your Dogecoin.{'\n\n'}
                  <Text fontWeight='semibold'>Enter password to continue.</Text>
                </Text>
                <Box pt='20px'>{renderPasswordInput()}</Box>
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
                  <BigButton
                    variant='primary'
                    onPress={onSubmit}
                    px='24px'
                    isDisabled={!password}
                  >
                    Continue
                  </BigButton>
                </Button.Group>
              </AlertDialog.Footer>
            </>
          ) : (
            <>
              <AlertDialog.Header>Your Recovery Phrase</AlertDialog.Header>
              <AlertDialog.Body>
                <Text
                  fontSize='16px'
                  bg='gray.200'
                  p='6px'
                  rounded='lg'
                  textAlign='center'
                >
                  {phrase}
                </Text>
                <Button.Group pt='24px' alignItems='center'>
                  <BigButton
                    variant='primary'
                    onPress={copyTextToClipboard}
                    px='24px'
                  >
                    Copy <FiCopy size={12} />
                  </BigButton>
                  <Text fontSize='12px' color='gray.500'>
                    {textCopied ? 'Phrase copied' : ' '}
                  </Text>
                </Button.Group>
              </AlertDialog.Body>
            </>
          )}
        </AlertDialog.Content>
      </AlertDialog>
    </>
  );
};
