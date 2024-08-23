import {
  AlertDialog,
  Box,
  Button,
  HStack,
  Text,
  Toast,
  VStack,
} from 'native-base';
import { useCallback, useEffect, useRef, useState } from 'react';
import { FaLink } from 'react-icons/fa';

import { BigButton } from '../../components/Button';
import { ClientPopupLoading } from '../../components/ClientPopupLoading';
import { OriginBadge } from '../../components/OriginBadge';
import { RecipientAddress } from '../../components/RecipientAddress';
import { ToastRender } from '../../components/ToastRender';
import { WalletAddress } from '../../components/WalletAddress';
import { DISPATCH_TYPES } from '../../Context';
import { MESSAGE_TYPES } from '../../scripts/helpers/constants';
import { getInscriptionsUtxos } from '../../scripts/helpers/doginals';
import { sendMessage } from '../../scripts/helpers/message';
import { validateAddress } from '../../scripts/helpers/wallet';
import { NFTView } from '../Transactions/components/NFTView';

export function ClientDoginalTransaction({
  params,
  dispatch,
  connectedClient,
  connectedAddressIndex,
  handleError,
}) {
  const { originTabId, origin, recipientAddress, output } = params;

  const handleWindowClose = useCallback(() => {
    dispatch({ type: DISPATCH_TYPES.CLEAR_CLIENT_REQUEST });
  }, [dispatch]);

  /**
   * @type {ReturnType<typeof useState<{ rawTx: string; fee: number; amount: number } | undefined}>>}
   */
  const [transaction, setTransaction] = useState();

  const [pageLoading, setPageLoading] = useState(false);
  const [selectedNFT, setSelectedNFT] = useState();

  useEffect(() => {
    if (!connectedClient?.address) return;
    (async () => {
      if (!validateAddress(recipientAddress)) {
        handleError({
          error: 'Invalid address',
          messageType:
            MESSAGE_TYPES.CLIENT_REQUEST_DOGINAL_TRANSACTION_RESPONSE,
        });
        return;
      }

      const txid = output.split(':')[0];
      const vout = parseInt(output.split(':')[1], 10);

      if (txid?.length !== 64 || Number.isNaN(vout)) {
        handleError({
          error: 'Invalid output',
          messageType:
            MESSAGE_TYPES.CLIENT_REQUEST_DOGINAL_TRANSACTION_RESPONSE,
        });
        return;
      }

      setPageLoading(true);

      const inscriptions = await getInscriptionsUtxos(connectedClient?.address);
      const doginal = inscriptions.find(
        (ins) => ins.txid === txid && ins.vout === vout
      );

      if (!doginal) {
        handleError({
          error: 'Doginal not found',
          messageType:
            MESSAGE_TYPES.CLIENT_REQUEST_DOGINAL_TRANSACTION_RESPONSE,
        });
        setPageLoading(false);
        return;
      }

      setSelectedNFT(doginal);

      sendMessage(
        {
          message: MESSAGE_TYPES.CREATE_NFT_TRANSACTION,
          data: {
            ...doginal,
            recipientAddress,
            output,
            address: connectedClient?.address,
            outputValue: doginal.outputValue,
          },
        },
        ({ rawTx, fee, amount }) => {
          setPageLoading(false);
          if (rawTx && fee && amount) {
            setTransaction({ rawTx, fee, amount });
          } else {
            handleError({
              error: 'Unable to create doginal transaction',
              messageType:
                MESSAGE_TYPES.CLIENT_REQUEST_DOGINAL_TRANSACTION_RESPONSE,
            });
            throw new Error('Unable to create doginal transaction');
          }
        }
      );
    })();
  }, [connectedClient?.address, handleError, output, recipientAddress]);

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
      <Text fontSize='lg' textAlign='center' fontWeight='semibold'>
        Transfer
      </Text>
      <Box
        borderRadius='12px'
        overflow='hidden'
        mb='12px'
        mx='20px'
        maxHeight='120px'
        maxWidth='150px'
      >
        {selectedNFT ? <NFTView nft={selectedNFT} /> : null}
      </Box>
      <RecipientAddress address={recipientAddress} />

      <Text fontSize='3xl' fontWeight='semibold' mt='-6px'>
        Ð{transaction.amount}
      </Text>
      <Text fontSize='13px' fontWeight='semibold' pt='6px'>
        Network fee Ð{transaction.fee}
      </Text>
      <HStack alignItems='center' mt='30px' space='12px'>
        <BigButton onPress={onRejectTransaction} variant='secondary' px='20px'>
          Cancel
        </BigButton>
        <BigButton
          onPress={() => setConfirmationModalOpen(true)}
          type='submit'
          role='button'
          px='28px'
        >
          Transfer
        </BigButton>
      </HStack>
      <ConfirmationModal
        showModal={confirmationModalOpen}
        onClose={onCloseModal}
        origin={origin}
        originTabId={originTabId}
        rawTx={transaction.rawTx}
        addressIndex={connectedAddressIndex}
        handleWindowClose={handleWindowClose}
        recipientAddress={recipientAddress}
        dogeAmount={transaction.amount}
      />
    </>
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
  recipientAddress,
  dogeAmount,
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
          sendMessage(
            {
              message:
                MESSAGE_TYPES.CLIENT_REQUEST_DOGINAL_TRANSACTION_RESPONSE,
              data: { txId, originTabId, origin },
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
  }, [addressIndex, handleWindowClose, onClose, origin, originTabId, rawTx]);

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
              <Text fontSize='10px' fontWeight='bold'>
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
