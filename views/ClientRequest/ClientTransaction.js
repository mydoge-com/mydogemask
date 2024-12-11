import {
  AlertDialog,
  Box,
  Button,
  Center,
  HStack,
  Text,
  VStack,
} from 'native-base';
import { useCallback, useEffect, useRef, useState } from 'react';
import { FaLink } from 'react-icons/fa';

import { BigButton } from '../../components/Button';
import { ClientPopupLoading } from '../../components/ClientPopupLoading';
import { OriginBadge } from '../../components/OriginBadge';
import { RecipientAddress } from '../../components/RecipientAddress';
import { WalletAddress } from '../../components/WalletAddress';
import { MESSAGE_TYPES } from '../../scripts/helpers/constants';
import { getAddressBalance } from '../../scripts/helpers/data';
import { sendMessage } from '../../scripts/helpers/message';
import { validateTransaction } from '../../scripts/helpers/wallet';

export function ClientTransaction({
  params,
  connectedClient,
  connectedAddressIndex,
  handleResponse,
}) {
  const { originTabId, origin, recipientAddress, dogeAmount } = params;

  const [pageLoading, setPageLoading] = useState(false);

  /**
   * @type {ReturnType<typeof useState<{ rawTx: string; fee: number; amount: number } | undefined}>>}
   */
  const [transaction, setTransaction] = useState();

  useEffect(() => {
    if (!connectedClient?.address) return;
    (async () => {
      setPageLoading(true);
      const balance = await getAddressBalance(connectedClient.address);

      const txData = {
        senderAddress: connectedClient.address,
        recipientAddress,
        dogeAmount,
      };

      const error = validateTransaction({
        ...txData,
        addressBalance: balance,
      });

      if (error) {
        handleResponse({
          toastMessage: 'Error creating transaction',
          toastTitle: 'Error',
          error,
        });
        return;
      }

      sendMessage(
        { message: MESSAGE_TYPES.CREATE_TRANSACTION, data: txData },
        ({ rawTx, fee, amount }) => {
          setPageLoading(false);
          if (rawTx && fee && amount) {
            setTransaction({ rawTx, fee, amount });
          } else {
            handleResponse({
              toastMessage: 'Error creating transaction',
              toastTitle: 'Error',
              error: 'Unable to create transaction',
            });
          }
        }
      );
    })();
  }, [
    connectedClient.address,
    dogeAmount,
    handleResponse,
    origin,
    originTabId,
    recipientAddress,
  ]);

  const [confirmationModalOpen, setConfirmationModalOpen] = useState(false);
  const onCloseModal = useCallback(() => {
    setConfirmationModalOpen(false);
  }, []);

  const onRejectTransaction = useCallback(() => {
    handleResponse({
      toastMessage: `MyDoge failed to authorize the transaction to ${origin}`,
      toastTitle: 'Transaction Rejected',
      error: 'User refused transaction',
    });
  }, [handleResponse, origin]);

  if (!transaction)
    return (
      <ClientPopupLoading
        pageLoading={pageLoading}
        origin={origin}
        loadingText='Creating transaction...'
      />
    );

  return (
    <>
      <Box p='8px' bg='brandYellow.500' rounded='full' my='16px'>
        <FaLink />
      </Box>
      <Text fontSize='2xl'>
        Confirm <Text fontWeight='bold'>Transaction</Text>
      </Text>
      <Center pt='16px'>
        <WalletAddress address={connectedClient.address} />
        <Text fontSize='lg' pb='4px' textAlign='center' fontWeight='semibold'>
          Paying
        </Text>
        <OriginBadge origin={origin} mt='12px' mb='20px' />
        <RecipientAddress address={recipientAddress} />

        <Text fontSize='3xl' fontWeight='semibold' pt='6px'>
          Ð{dogeAmount}
        </Text>
        <Text fontSize='13px' fontWeight='semibold' pt='6px'>
          Network fee Ð{transaction.fee}
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
        rawTx={transaction.rawTx}
        addressIndex={connectedAddressIndex}
        recipientAddress={recipientAddress}
        dogeAmount={dogeAmount}
        handleResponse={handleResponse}
        origin={origin}
      />
    </>
  );
}

const ConfirmationModal = ({
  showModal,
  onClose,
  rawTx,
  addressIndex,
  handleResponse,
  recipientAddress,
  dogeAmount,
  origin,
}) => {
  const cancelRef = useRef();
  const [loading, setLoading] = useState(false);

  const onSubmit = useCallback(async () => {
    setLoading(true);
    sendMessage(
      {
        message: MESSAGE_TYPES.SEND_TRANSACTION,
        data: { rawTx, selectedAddressIndex: addressIndex },
      },
      (txId) => {
        setLoading(false);
        onClose();
        if (txId) {
          handleResponse({
            toastMessage: 'Transaction Sent',
            toastTitle: 'Success',
            data: { txId },
          });
        } else {
          handleResponse({
            toastMessage: 'Failed to send transaction.',
            toastTitle: 'Error',
            error: 'Failed to send transaction',
          });
        }
      }
    );
  }, [addressIndex, handleResponse, onClose, rawTx]);

  return (
    <>
      {/* <Modal isOpen={loading} full>
        <Modal.Body h='600px' justifyContent='center'>
          <Spinner size='lg' />
        </Modal.Body>
      </Modal> */}
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
              <Text
                fontSize='10px'
                fontWeight='bold'
                mt='12px'
                bg='gray.200'
                borderRadius='4px'
                px='4px'
                py='2px'
              >
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
                isDisabled={loading}
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
