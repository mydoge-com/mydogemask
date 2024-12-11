import { AlertDialog, Box, Button, HStack, Text, VStack } from 'native-base';
import { useCallback, useEffect, useRef, useState } from 'react';
import { FaLink } from 'react-icons/fa';

import { BigButton } from '../../components/Button';
import { ClientPopupLoading } from '../../components/ClientPopupLoading';
import { OriginBadge } from '../../components/OriginBadge';
import { RecipientAddress } from '../../components/RecipientAddress';
import { WalletAddress } from '../../components/WalletAddress';
import {
  MESSAGE_TYPES,
  TRANSACTION_TYPES,
} from '../../scripts/helpers/constants';
import { getInscriptionsUtxo } from '../../scripts/helpers/doginals';
import { sendMessage } from '../../scripts/helpers/message';
import { validateAddress } from '../../scripts/helpers/wallet';
import { NFTView } from '../Transactions/components/NFTView';

export function ClientDoginalTransaction({
  params,
  connectedClient,
  connectedAddressIndex,
  handleResponse,
}) {
  const { originTabId, origin, recipientAddress, location } = params;

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
        handleResponse({
          toastMessage: 'Invalid address',
          toastTitle: 'Error',
          error: 'Invalid address',
        });
        return;
      }

      const split = location.split(':');
      const txid = split[0];
      const vout = Number(split[1]);
      const offset = Number(split[2]);

      if (txid?.length !== 64 || Number.isNaN(vout)) {
        handleResponse({
          toastMessage: 'Invalid output',
          toastTitle: 'Error',
          error: 'Invalid output',
        });
        return;
      }

      setPageLoading(true);

      const doginal = await getInscriptionsUtxo(connectedClient?.address, {
        txid,
        vout,
      });

      if (!doginal || !doginal.inscriptions?.find((i) => i.offset === offset)) {
        handleResponse({
          toastMessage: 'NFT not found',
          toastTitle: 'Error',
          error: 'NFT not found',
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
            location,
            address: connectedClient?.address,
            outputValue: doginal.outputValue,
          },
        },
        ({ rawTx, fee, amount }) => {
          setPageLoading(false);
          if (rawTx && fee && amount) {
            setTransaction({ rawTx, fee, amount });
          } else {
            handleResponse({
              toastMessage: 'Unable to create NFT transaction',
              toastTitle: 'Error',
              error: 'Unable to create NFT transaction',
            });
          }
        }
      );
    })();
  }, [connectedClient?.address, handleResponse, location, recipientAddress]);

  const [confirmationModalOpen, setConfirmationModalOpen] = useState(false);
  const onCloseModal = useCallback(() => {
    setConfirmationModalOpen(false);
  }, []);

  const onRejectTransaction = useCallback(() => {
    handleResponse({
      toastMessage: 'Transaction Rejected',
      toastTitle: 'Error',
      error: 'User refused transaction',
    });
  }, [handleResponse]);

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
        // handleWindowClose={handleWindowClose}
        recipientAddress={recipientAddress}
        dogeAmount={transaction.amount}
        selectedNFT={selectedNFT}
        // responseMessageType={responseMessageType}
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
  recipientAddress,
  dogeAmount,
  selectedNFT,
  handleResponse,
}) => {
  const cancelRef = useRef();
  const [loading, setLoading] = useState(false);

  const onSubmit = useCallback(async () => {
    setLoading(true);
    sendMessage(
      {
        message: MESSAGE_TYPES.SEND_TRANSACTION,
        data: {
          rawTx,
          selectedAddressIndex: addressIndex,
          txType: TRANSACTION_TYPES.DOGINAL_TX,
          location: selectedNFT.location,
        },
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
            toastMessage: 'Transaction Failed',
            toastTitle: 'Error',
            error: 'Failed to send transaction',
          });
        }
      }
    );
  }, [addressIndex, handleResponse, onClose, rawTx, selectedNFT.location]);

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
