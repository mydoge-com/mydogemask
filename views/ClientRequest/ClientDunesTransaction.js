import { AlertDialog, Box, Button, HStack, Text, VStack } from 'native-base';
import { useCallback, useEffect, useRef, useState } from 'react';
import { FaLink } from 'react-icons/fa';

import { BigButton } from '../../components/Button';
import { ClientPopupLoading } from '../../components/ClientPopupLoading';
import { OriginBadge } from '../../components/OriginBadge';
import { WalletAddress } from '../../components/WalletAddress';
import { MESSAGE_TYPES } from '../../scripts/helpers/constants';
import { getDunesBalances } from '../../scripts/helpers/doginals';
import { sendMessage } from '../../scripts/helpers/message';
import { validateAddress } from '../../scripts/helpers/wallet';

export function ClientDunesTransaction({
  params,
  connectedClient,
  connectedAddressIndex,
  handleResponse,
}) {
  const { origin, ticker, amount, recipientAddress } = params ?? {};

  const [confirmationModalOpen, setConfirmationModalOpen] = useState(false);
  const onCloseModal = useCallback(() => {
    setConfirmationModalOpen(false);
  }, []);

  const [pageLoading, setPageLoading] = useState(false);

  /**
   * @type {ReturnType<typeof useState<{ txs: string[]; fee: number; } | undefined}>>}
   */
  const [transaction, setTransaction] = useState();

  const onRejectTransaction = useCallback(() => {
    handleResponse({
      toastMessage: `MyDoge failed to authorize the transaction to ${origin}`,
      toastTitle: 'Transaction Rejected',
      error: 'User refused transaction',
    });
  }, [handleResponse, origin]);

  useEffect(() => {
    if (!connectedClient?.address) return;
    (async () => {
      setPageLoading(true);

      if (!validateAddress(recipientAddress)) {
        handleResponse({
          toastMessage: 'Invalid recipient address',
          toastTitle: 'Error',
          error: 'Invalid recipient address',
        });
        return;
      }

      const balances = await getDunesBalances(connectedClient?.address, ticker);
      const { duneId, overallBalance } = balances[0];
      const ab = Number(overallBalance || 0);
      const amt = Number(amount);

      if (ab < amt) {
        handleResponse({
          toastMessage: 'Insufficient balance',
          toastTitle: 'Error',
          error: 'Insufficient balance',
        });
        return;
      }

      sendMessage(
        {
          message: MESSAGE_TYPES.CREATE_DUNES_TRANSACTION,
          data: {
            ...params,
            duneId,
            tokenAmount: amount,
            selectedAddressIndex: connectedAddressIndex,
            walletAddress: connectedClient?.address,
            recipientAddress,
          },
        },
        ({ rawTx, fee, amount: txAmount }) => {
          setPageLoading(false);
          if (rawTx && fee && txAmount) {
            setTransaction({ rawTx, fee, amount });
          } else {
            handleResponse({
              error: 'Unable to create available dunes transaction',
              toastTitle: 'Error',
              toastMessage: 'Unable to create transaction',
            });
          }
        }
      );
    })();
  }, [
    amount,
    connectedAddressIndex,
    connectedClient?.address,
    handleResponse,
    params,
    ticker,
    recipientAddress,
  ]);

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
      <OriginBadge origin={origin} mb='4px' />
      <Box p='8px' bg='brandYellow.500' rounded='full' my='16px'>
        <FaLink />
      </Box>
      <Text fontSize='2xl' pb='24px'>
        Confirm <Text fontWeight='bold'>Transaction</Text>
      </Text>
      <WalletAddress address={connectedClient.address} />
      <Text fontSize='lg' pb='10px' textAlign='center' fontWeight='semibold'>
        Sending
      </Text>
      <Text fontSize='3xl' fontWeight='semibold' pt='6px'>
        {ticker} {Number(amount).toLocaleString()}
      </Text>
      <Text fontSize='lg' pb='10px' textAlign='center' fontWeight='semibold'>
        To
      </Text>
      <WalletAddress address={recipientAddress} />
      <Text fontSize='13px' fontWeight='semibold' pt='6px'>
        Network fee: <Text fontWeight='normal'>Ð{transaction?.fee}</Text>
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
          Send
        </BigButton>
      </HStack>
      <ConfirmationModal
        showModal={confirmationModalOpen}
        onClose={onCloseModal}
        params={params}
        rawTx={transaction?.rawTx}
        handleResponse={handleResponse}
        origin={origin}
      />
    </>
  );
}

const ConfirmationModal = ({
  showModal,
  onClose,
  params,
  rawTx,
  handleResponse,
  origin,
}) => {
  const cancelRef = useRef();
  const [loading, setLoading] = useState(false);
  const { ticker, amount: tokenAmount } = params;

  const onSubmit = useCallback(async () => {
    setLoading(true);
    sendMessage(
      {
        message: MESSAGE_TYPES.SEND_TRANSACTION,
        data: { ...params, rawTx, tokenAmount, ticker },
      },
      (txId) => {
        setLoading(false);
        if (txId) {
          handleResponse({
            toastMessage: 'Transaction Sent',
            toastTitle: 'Success',
            data: { tokenAmount, ticker, txId },
          });
        } else {
          handleResponse({
            toastMessage: 'Failed to send dunes transaction',
            toastTitle: 'Error',
            error: 'Failed to send dunes transaction',
          });
        }
      }
    );
  }, [handleResponse, params, ticker, tokenAmount, rawTx]);

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
            <OriginBadge origin={origin} mb='18px' />
            <VStack alignItems='center'>
              <Text textAlign='center'>
                Confirm transaction to send{'\n'}
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
