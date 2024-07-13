import {
  AlertDialog,
  Box,
  Button,
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

export function ClientAvailableDRC20Transaction({
  params,
  dispatch,
  connectedClient,
}) {
  const handleWindowClose = useCallback(() => {
    dispatch({ type: DISPATCH_TYPES.CLEAR_CLIENT_REQUEST });
  }, [dispatch]);

  const { origin, originTabId, ticker, amount, fee } = params ?? {};

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
      <OriginBadge origin={origin} mb='4px' />
      <Box p='8px' bg='brandYellow.500' rounded='full' my='16px'>
        <FaLink />
      </Box>
      <Text fontSize='2xl' pb='24px'>
        Confirm <Text fontWeight='bold'>Transaction</Text>
      </Text>
      <WalletAddress address={connectedClient.address} />
      <Text fontSize='lg' pb='10px' textAlign='center' fontWeight='semibold'>
        Inscribing
      </Text>
      <Text fontSize='3xl' fontWeight='semibold' pt='6px'>
        {ticker} {Number(amount).toLocaleString()}
      </Text>
      <Text fontSize='13px' fontWeight='semibold' pt='6px'>
        Network fee: <Text fontWeight='normal'>Ð{fee}</Text>
      </Text>

      <HStack alignItems='center' mt='60px' space='12px'>
        <Button
          variant='unstyled'
          colorScheme='coolGray'
          onPress={onRejectTransaction}
        >
          Cancel
        </Button>
        <BigButton
          onPress={() => setConfirmationModalOpen(true)}
          type='submit'
          role='button'
          px='28px'
        >
          Inscribe
        </BigButton>
      </HStack>
      <ConfirmationModal
        showModal={confirmationModalOpen}
        onClose={onCloseModal}
        params={params}
        handleWindowClose={handleWindowClose}
      />
    </>
  );
}

const ConfirmationModal = ({
  showModal,
  onClose,
  params,
  handleWindowClose,
}) => {
  const cancelRef = useRef();
  const [loading, setLoading] = useState(false);
  const { origin, originTabId, ticker, amount: tokenAmount, txs } = params;

  const onSubmit = useCallback(async () => {
    setLoading(true);
    sendMessage(
      {
        message: MESSAGE_TYPES.SEND_TRANSFER_TRANSACTION,
        data: { ...params, txs, tokenAmount, ticker },
      },
      (txId) => {
        if (txId) {
          sendMessage(
            {
              message:
                MESSAGE_TYPES.CLIENT_REQUEST_AVAILABLE_DRC20_TRANSACTION_RESPONSE,
              data: { ...params, txs, tokenAmount, ticker, txId },
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
          sendMessage({
            message:
              MESSAGE_TYPES.CLIENT_REQUEST_AVAILABLE_DRC20_TRANSACTION_RESPONSE,
            data: {
              error: 'Failed to inscribe token transfer',
              originTabId,
              origin,
            },
          });
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
      }
    );
  }, [
    handleWindowClose,
    origin,
    originTabId,
    params,
    ticker,
    tokenAmount,
    txs,
  ]);

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
            <OriginBadge origin={origin} mb='18px' />
            <VStack alignItems='center'>
              <Text textAlign='center'>
                Confirm transaction to inscribe{'\n'}
                <Text fontWeight='bold' fontSize='md'>
                  {ticker} {Number(tokenAmount).toLocaleString()}
                </Text>
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
              <BigButton onPress={onSubmit} px='24px' loading={loading}>
                Confirm
              </BigButton>
            </Button.Group>
          </AlertDialog.Footer>
        </AlertDialog.Content>
      </AlertDialog>
    </>
  );
};
