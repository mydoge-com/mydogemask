import {
  AlertDialog,
  Box,
  Button,
  Center,
  HStack,
  Modal,
  Pressable,
  ScrollView,
  Spinner,
  Text,
  VStack,
  Toast,
} from 'native-base';
import { useCallback, useEffect, useRef, useState } from 'react';
import { FaLink } from 'react-icons/fa';
import sb from 'satoshi-bitcoin';

import { BigButton } from '../../components/Button';
import { OriginBadge } from '../../components/OriginBadge';
import { ToastRender } from '../../components/ToastRender';
import { WalletAddress } from '../../components/WalletAddress';
import { MESSAGE_TYPES } from '../../scripts/helpers/constants';
import { sendMessage } from '../../scripts/helpers/message';
import { getCachedTx } from '../../scripts/helpers/storage';
import { decodeRawPsbt } from '../../scripts/helpers/wallet';

export function ClientPSBT({
  params,
  connectedClient,
  connectedAddressIndex: selectedAddressIndex,
  handleResponse,
}) {
  const {
    originTabId,
    origin,
    rawTx,
    indexes: indexesParam,
    signOnly,
  } = params;

  const [psbt, setPsbt] = useState(null);
  const [inputs, setInputs] = useState([]);
  const [dogeAmount, setDogeAmount] = useState(0);
  const [dogeFee, setDogeFee] = useState(0.0);
  const [indexes] = useState([indexesParam].flat());

  useEffect(() => {
    if (typeof selectedAddressIndex !== 'number') return;
    try {
      setPsbt(decodeRawPsbt(rawTx));
      sendMessage(
        {
          message: MESSAGE_TYPES.SIGN_PSBT,
          data: { rawTx, indexes, selectedAddressIndex, feeOnly: true },
        },
        ({ fee }) => {
          console.log('fee', fee);
          if (fee) {
            setDogeFee(fee);
          }
        }
      );
    } catch (error) {
      handleFailedTransaction({
        title: 'Error',
        description: 'Invalid PSBT',
      });
    }
  }, [handleFailedTransaction, rawTx, indexes, selectedAddressIndex]);

  useEffect(() => {
    (async () => {
      if (psbt) {
        let amount = 0;
        const mappedInputs = await Promise.all(
          psbt?.txInputs?.map(async (input, index) => {
            const hash = Buffer.from(input.hash.reverse());
            const txid = hash.toString('hex');
            const tx = await getCachedTx(txid);
            const value = sb.toBitcoin(tx.vout[input.index].value);

            if (indexes.includes(index)) {
              amount += value;
            }

            return {
              txid,
              value,
              inputIndex: index,
              vout: input.index,
            };
          })
        );

        // Subtract change output
        psbt?.txOutputs?.forEach((output) => {
          if (output.address === connectedClient.address) {
            amount -= sb.toBitcoin(output.value);
          }
        });

        setDogeAmount(amount);
        setInputs(mappedInputs);
      }
    })();
  }, [psbt, indexes]);

  const outputs = psbt?.txOutputs?.map((output, index) => {
    return {
      outputIndex: index,
      address: output.address,
      value: sb.toBitcoin(output.value),
    };
  });

  const [confirmationModalOpen, setConfirmationModalOpen] = useState(false);

  const onCloseModal = useCallback(() => {
    setConfirmationModalOpen(false);
  }, []);

  const handleFailedTransaction = useCallback(
    ({
      title = 'Transaction Failed',
      description = 'Error creating transaction',
    }) => {
      setLoading(false);
      handleResponse({
        toastMessage: description,
        toastTitle: title,
        error: 'Error creating transaction',
      });
    },
    [handleResponse]
  );

  const onRejectTransaction = useCallback(() => {
    handleResponse({
      toastMessage: `MyDoge failed to authorize the transaction to ${origin}`,
      toastTitle: 'Transaction Rejected',
      error: 'User refused transaction',
    });
  }, [handleResponse, origin]);

  const [loading, setLoading] = useState(false);

  const onSubmit = useCallback(async () => {
    setLoading(true);
    sendMessage(
      {
        message: MESSAGE_TYPES.SIGN_PSBT,
        data: { rawTx, indexes, selectedAddressIndex },
      },
      ({ rawTx: signedRawTx, fee, amount }) => {
        if (signedRawTx && fee && amount) {
          if (!signOnly) {
            sendMessage(
              {
                message: MESSAGE_TYPES.SEND_PSBT,
                data: { rawTx: signedRawTx, selectedAddressIndex },
              },
              (txId) => {
                setLoading(false);
                if (txId) {
                  handleResponse({
                    toastMessage: 'Transaction Sent',
                    toastTitle: 'Success',
                    data: { txId },
                  });
                } else {
                  handleFailedTransaction({
                    title: 'Error',
                    description: 'Failed to send transaction.',
                  });
                }
              }
            );
          } else {
            sendMessage(
              {
                message: MESSAGE_TYPES.CLIENT_REQUEST_PSBT_RESPONSE,
                data: { signedRawTx, originTabId, origin },
              },
              () => {
                Toast.show({
                  duration: 3000,
                  render: () => {
                    return (
                      <ToastRender
                        description='Transaction Signed'
                        status='success'
                      />
                    );
                  },
                });
                handleWindowClose();
              }
            );
          }
        } else {
          handleFailedTransaction({
            title: 'Error',
            description: 'Unable to create psbt transaction',
          });
        }
      }
    );
  }, [
    rawTx,
    indexes,
    selectedAddressIndex,
    handleResponse,
    handleFailedTransaction,
    signOnly,
  ]);

  const [inputsModalOpen, setInputsModalOpen] = useState(false);
  const [outputsModalOpen, setOutputsModalOpen] = useState(false);

  if (!psbt) {
    return null;
  }

  return (
    <>
      <Box p='8px' bg='brandYellow.500' rounded='full' my='16px'>
        <FaLink />
      </Box>
      <Text fontSize='2xl'>
        Confirm <Text fontWeight='bold'>Transaction</Text>
      </Text>
      <Center pt='16px' w='300px'>
        <WalletAddress address={connectedClient.address} />
        <Text fontSize='lg' pb='4px' textAlign='center' fontWeight='semibold'>
          {signOnly ? 'Sign' : 'Send'} PSBT
        </Text>
        <OriginBadge origin={origin} mt='12px' mb='10px' />
        <HStack py='20px' justifyContent='center' space='16px' mt='-10px'>
          {inputs?.length ? (
            <Pressable onPress={() => setInputsModalOpen(true)}>
              <Text
                fontSize='14px'
                fontWeight='semibold'
                color='gray.400'
                underline={{ textDecorationLine: 'underline' }}
              >
                Inputs ({inputs.length})
              </Text>
            </Pressable>
          ) : null}
          {outputs?.length ? (
            <Pressable onPress={() => setOutputsModalOpen(true)}>
              <Text
                fontSize='14px'
                fontWeight='semibold'
                color='gray.400'
                underline={{ textDecorationLine: 'underline' }}
              >
                Outputs ({outputs.length})
              </Text>
            </Pressable>
          ) : null}
        </HStack>

        <Text fontSize='3xl' fontWeight='semibold' pt='6px'>
          Ð{dogeAmount}
        </Text>
        <Text fontSize='13px' fontWeight='semibold' pt='6px'>
          Network fee Ð{dogeFee}
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
            {signOnly ? 'Sign' : 'Send'}
          </BigButton>
        </HStack>
      </Center>
      <ConfirmationModal
        showModal={confirmationModalOpen}
        onClose={onCloseModal}
        origin={origin}
        onSubmit={onSubmit}
        loading={loading}
        dogeAmount={dogeAmount}
        signOnly={signOnly}
      />
      <Modal
        isOpen={inputsModalOpen}
        onClose={() => setInputsModalOpen(false)}
        size='xl'
      >
        <Modal.Content>
          <Modal.CloseButton />
          <Modal.Header>Inputs</Modal.Header>
          <Modal.Body alignItems='center'>
            <ScrollView>
              <VStack space='16px'>
                {inputs.map(({ inputIndex, txid, vout, value }) => (
                  <VStack
                    alignItems='flex-start'
                    justifyContent='flex-start'
                    key={inputIndex}
                  >
                    <Text
                      fontSize='14px'
                      fontWeight='bold'
                      paddingBottom='10px'
                    >
                      Input Index {inputIndex}
                    </Text>
                    <VStack>
                      <Text
                        fontSize='10px'
                        fontWeight='medium'
                        color='gray.600'
                      >
                        Transaction ID
                      </Text>
                      <Text
                        fontSize='12px'
                        fontWeight='medium'
                        color='gray.600'
                        width='300px'
                      >
                        {txid}
                      </Text>
                    </VStack>
                    <VStack>
                      <Text
                        fontSize='10px'
                        fontWeight='medium'
                        color='gray.500'
                      >
                        Vout
                      </Text>
                      <Text
                        fontSize='12px'
                        fontWeight='medium'
                        color='gray.700'
                      >
                        {vout}
                      </Text>
                    </VStack>
                    <VStack>
                      <Text
                        fontSize='10px'
                        fontWeight='medium'
                        color='gray.600'
                      >
                        Value
                      </Text>
                      <Text
                        fontSize='12px'
                        fontWeight='medium'
                        color='gray.600'
                      >
                        {value}
                      </Text>
                    </VStack>
                  </VStack>
                ))}
              </VStack>
            </ScrollView>
          </Modal.Body>
        </Modal.Content>
      </Modal>
      <Modal
        isOpen={outputsModalOpen}
        onClose={() => setOutputsModalOpen(false)}
        size='xl'
      >
        <Modal.Content>
          <Modal.CloseButton />
          <Modal.Header>Outputs</Modal.Header>
          <Modal.Body alignItems='center'>
            <ScrollView>
              <VStack space='16px'>
                {outputs.map(({ outputIndex, address, value }) => (
                  <VStack
                    alignItems='flex-start'
                    justifyContent='flex-start'
                    w='300px'
                    key={outputIndex}
                  >
                    <Text fontSize='14px' fontWeight='bold' paddingBottom='6px'>
                      Output Index {outputIndex}
                    </Text>
                    <VStack>
                      <Text
                        fontSize='10px'
                        fontWeight='medium'
                        color='gray.600'
                      >
                        Address:{' '}
                      </Text>
                      <Text
                        fontSize='12px'
                        fontWeight='medium'
                        color='gray.600'
                        width='300px'
                      >
                        {address}
                      </Text>
                    </VStack>
                    <VStack>
                      <Text
                        fontSize='10px'
                        fontWeight='medium'
                        color='gray.600'
                      >
                        Value
                      </Text>
                      <Text
                        fontSize='12px'
                        fontWeight='medium'
                        color='gray.600'
                      >
                        {value}
                      </Text>
                    </VStack>
                  </VStack>
                ))}
              </VStack>
            </ScrollView>
          </Modal.Body>
        </Modal.Content>
      </Modal>
    </>
  );
}

const ConfirmationModal = ({
  showModal,
  onClose,
  origin,
  onSubmit,
  loading,
  dogeAmount,
  signOnly,
}) => {
  const cancelRef = useRef();

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
          <AlertDialog.Body alignItems='center'>
            <OriginBadge origin={origin} mb='8px' />
            <VStack alignItems='center'>
              <Text>
                Confirm transaction to {signOnly ? 'sign' : 'send'}{' '}
                <Text fontWeight='bold'>Ð{dogeAmount}</Text>
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
                disabled={loading}
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
