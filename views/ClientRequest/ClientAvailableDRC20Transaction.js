import {
  AlertDialog,
  Box,
  Button,
  HStack,
  Text,
  // Toast,
  VStack,
} from 'native-base';
import { useCallback, useEffect, useRef, useState } from 'react';
import { FaLink } from 'react-icons/fa';

import { BigButton } from '../../components/Button';
import { ClientPopupLoading } from '../../components/ClientPopupLoading';
import { OriginBadge } from '../../components/OriginBadge';
// import { ToastRender } from '../../components/ToastRender';
import { WalletAddress } from '../../components/WalletAddress';
// import { DISPATCH_TYPES } from '../../Context';
import { MESSAGE_TYPES } from '../../scripts/helpers/constants';
import { getDRC20Balances } from '../../scripts/helpers/doginals';
import { sendMessage } from '../../scripts/helpers/message';

export function ClientAvailableDRC20Transaction({
  params,
  // dispatch,
  connectedClient,
  connectedAddressIndex,
  handleResponse,
  // handleError,
  // responseMessageType,
}) {
  // const handleWindowClose = useCallback(() => {
  //   dispatch({ type: DISPATCH_TYPES.CLEAR_CLIENT_REQUEST });
  // }, [dispatch]);

  const { origin, ticker, amount } = params ?? {};

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
    // sendMessage(
    //   {
    //     message: responseMessageType,
    //     data: { error: 'User refused transaction', originTabId, origin },
    //   },
    //   () => {
    //     Toast.show({
    //       duration: 3000,
    //       render: () => {
    //         return (
    //           <ToastRender
    //             title='Transaction Rejected'
    //             description={`MyDoge failed to authorize the transaction to ${origin}`}
    //             status='error'
    //           />
    //         );
    //       },
    //     });
    //     handleWindowClose();
    //   },
    //   []
    // );
  }, [handleResponse, origin]);

  useEffect(() => {
    if (!connectedClient?.address || typeof connectedAddressIndex !== 'number')
      return;
    (async () => {
      setPageLoading(true);
      const balances = await getDRC20Balances(connectedClient?.address, ticker);
      const ab = Number(balances[0]?.availableBalance || 0);
      const amt = Number(amount);

      if (ab < amt) {
        setPageLoading(false);
        handleResponse({
          toastMessage: 'Insufficient balance',
          toastTitle: 'Error',
          error: 'Insufficient balance',
        });
        return;
      }

      sendMessage(
        {
          message: MESSAGE_TYPES.CREATE_TRANSFER_TRANSACTION,
          data: {
            ...params,
            tokenAmount: amount,
            selectedAddressIndex: connectedAddressIndex,
            walletAddress: connectedClient?.address,
          },
        },
        ({ txs, fee }) => {
          setPageLoading(false);
          if (txs?.length && fee) {
            setTransaction({ txs, fee });
          } else {
            handleResponse({
              error: 'Unable to create available drc-20 transaction',
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
        Inscribing
      </Text>
      <Text fontSize='3xl' fontWeight='semibold' pt='6px'>
        {ticker} {Number(amount).toLocaleString()}
      </Text>
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
          Inscribe
        </BigButton>
      </HStack>
      <ConfirmationModal
        showModal={confirmationModalOpen}
        onClose={onCloseModal}
        params={params}
        // handleWindowClose={handleWindowClose}
        txs={transaction?.txs}
        // responseMessageType={responseMessageType}
        handleResponse={handleResponse}
      />
    </>
  );
}

const ConfirmationModal = ({
  showModal,
  onClose,
  params,
  // handleWindowClose,
  // responseMessageType,
  txs,
  handleResponse,
}) => {
  const cancelRef = useRef();
  const [loading, setLoading] = useState(false);
  const { origin, ticker, amount: tokenAmount } = params;

  const onSubmit = useCallback(async () => {
    setLoading(true);
    sendMessage(
      {
        message: MESSAGE_TYPES.SEND_TRANSFER_TRANSACTION,
        data: { ...params, txs, tokenAmount, ticker },
      },
      (txId) => {
        setLoading(false);
        if (txId) {
          handleResponse({
            toastMessage: 'Transaction Sent',
            toastTitle: 'Success',
            data: { tokenAmount, ticker, txId },
          });
          // sendMessage(
          //   {
          //     message: responseMessageType,
          //     data: { tokenAmount, ticker, txId, originTabId, origin },
          //   },
          //   () => {
          //     onClose();
          //     Toast.show({
          //       duration: 3000,
          //       render: () => {
          //         return (
          //           <ToastRender
          //             description='Transaction Sent'
          //             status='success'
          //           />
          //         );
          //       },
          //     });
          //     handleWindowClose();
          //   }
          // );
        } else {
          handleResponse({
            toastMessage: 'Failed to inscribe token transfer',
            toastTitle: 'Error',
            error: 'Failed to inscribe token transfer',
          });
          //     data: {
          //       error: 'Failed to inscribe token transfer',
          //       originTabId,
          //       origin,
          //     },
          //   });
          //   Toast.show({
          //     title: 'Error',
          //     description: 'Transaction Failed',
          //     duration: 3000,
          //     render: () => {
          //       return (
          //         <ToastRender
          //           title='Error'
          //           description='Failed to send transaction.'
          //           status='error'
          //         />
          //       );
          //     },
          // });
          // handleWindowClose();
        }
      }
    );
  }, [handleResponse, params, ticker, tokenAmount, txs]);

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
