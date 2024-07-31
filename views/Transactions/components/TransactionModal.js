import dayjs from 'dayjs';
import { Avatar, Box, Button, HStack, Modal, Text, VStack } from 'native-base';
import { useEffect, useState } from 'react';
import { FiArrowUpRight, FiCopy } from 'react-icons/fi';

import { BigButton } from '../../../components/Button';
import { InscriptionIndicator } from '../../../components/InscriptionIndicator';
import { useCopyText } from '../../../hooks/useCopyText';
import { nownodes } from '../../../scripts/api';
import { TRANSACTION_TYPES } from '../../../scripts/helpers/constants';
import { setLocalValue } from '../../../scripts/helpers/storage';
import { formatSatoshisAsDoge } from '../../../utils/formatters';

export const TransactionModal = ({
  isOpen,
  onClose,
  transaction,
  cachedInscription,
}) => {
  const { address, type, amount, blockTime, id, confirmations } =
    transaction ?? {};
  const [conf, setConf] = useState(confirmations);
  const { copyTextToClipboard, textCopied } = useCopyText({ text: address });

  useEffect(() => {
    (async () => {
      if (isOpen) {
        const tx = await nownodes.get(`/tx/${id}`).json();
        setConf(tx.confirmations);
        await setLocalValue({ [id]: tx });
      }
    })();
  }, [id, isOpen]);

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size='full'>
      <Modal.Content w='90%'>
        <Modal.CloseButton />
        <Modal.Body alignItems='center' pt='54px' pb='36px'>
          <VStack w='100%' alignItems='center'>
            <Text
              fontSize='sm'
              pb='4px'
              textAlign='center'
              fontWeight='semibold'
            >
              {type === 'outgoing' ? 'TO' : 'FROM'}
            </Text>
            <HStack alignItems='center' space='12px'>
              <Avatar
                size='sm'
                bg='brandYellow.500'
                _text={{ color: 'gray.800' }}
              >
                {address.substring(0, 2)}
              </Avatar>
              <Text
                fontSize='sm'
                fontWeight='semibold'
                color='gray.500'
                textAlign='center'
              >
                {address.slice(0, 8)}...{address.slice(-4)}
              </Text>
              <Button
                variant='subtle'
                px='6px'
                py='4px'
                onPress={copyTextToClipboard}
                colorScheme='gray'
              >
                <FiCopy />
              </Button>
            </HStack>
            <Text fontSize='10px' color='gray.500'>
              {textCopied ? 'Address copied' : ' '}
            </Text>
            <Text
              textAlign='center'
              fontSize='28px'
              fontWeight='semibold'
              pb='12px'
            >
              Ɖ{formatSatoshisAsDoge(amount, 3)}
            </Text>
            <HStack justifyContent='center' w='100%' mb='8px'>
              <InscriptionIndicator
                cachedInscription={cachedInscription}
                mb='8px'
                py='4px'
                px='10px'
                _text={{ fontSize: '12px' }}
                showFullLabel
              />
            </HStack>

            {cachedInscription &&
            (cachedInscription.txType ===
              TRANSACTION_TYPES.DRC20_AVAILABLE_TX ||
              cachedInscription.txType ===
                TRANSACTION_TYPES.DRC20_SEND_INSCRIPTION_TX) ? (
              <>
                <HStack justifyContent='space-between' w='100%'>
                  <Text color='gray.500'>Ticker </Text>
                  <Text fontWeight='semibold'>{cachedInscription.ticker}</Text>
                </HStack>
                <HStack justifyContent='space-between' w='100%'>
                  <Text color='gray.500'>Token Amount </Text>
                  <Text fontWeight='semibold'>
                    {Number(cachedInscription.tokenAmount).toLocaleString()}
                  </Text>
                </HStack>
              </>
            ) : null}

            <HStack justifyContent='space-between' w='100%'>
              <Text color='gray.500'>Confirmations </Text>
              <Text fontWeight='semibold'>{conf}</Text>
            </HStack>
            <HStack justifyContent='space-between' w='100%' pt='6px'>
              <Text color='gray.500'>Timestamp </Text>
              <Text fontWeight='semibold'>
                {dayjs(blockTime * 1000).format('YYYY-MM-DD HH:mm:ss')}
              </Text>
            </HStack>
            <Box pt='32px'>
              <BigButton
                onPress={() => window.open(`https://sochain.com/tx/DOGE/${id}`)}
                variant='secondary'
                px='28px'
              >
                View on SoChain <FiArrowUpRight />
              </BigButton>
            </Box>
          </VStack>
        </Modal.Body>
      </Modal.Content>
    </Modal>
  );
};
