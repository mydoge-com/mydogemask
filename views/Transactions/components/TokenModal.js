import dayjs from 'dayjs';
import {
  Avatar,
  Box,
  Button,
  HStack,
  Modal,
  Spinner,
  Text,
  VStack,
} from 'native-base';
import { useCallback, useEffect, useState } from 'react';
import { BiTransfer } from 'react-icons/bi';

import { BigButton } from '../../../components/Button';
import { doginalsMarketplace } from '../../../scripts/api';
import { TICKER_ICON_URL } from '../../../scripts/helpers/constants';
import { logError } from '../../../utils/error';
import { formatSatoshisAsDoge } from '../../../utils/formatters';

export const TokenModal = ({
  isOpen,
  onClose,
  token: { availableBalance, overallBalance, ticker, transferableBalance },
}) => {
  const [tokenDetails, setTokenDetails] = useState();

  const fetchTokenDetails = useCallback(() => {
    doginalsMarketplace
      .get(`/drc20/data?tick=${ticker}`)
      .json((res) => {
        setTokenDetails(res);
        console.log(res);
      })
      .catch(logError);
  }, [ticker]);

  useEffect(() => {
    if (isOpen) {
      fetchTokenDetails();
    }
  }, [fetchTokenDetails, isOpen]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} size='full'>
      <Modal.Content w='90%'>
        <Modal.CloseButton />
        <Modal.Body alignItems='center' pt='54px' pb='36px'>
          <VStack w='100%' alignItems='center'>
            <VStack alignItems='center' space='12px'>
              <Avatar
                size='md'
                bg='brandYellow.500'
                _text={{ color: 'gray.800' }}
                source={{
                  uri: `${TICKER_ICON_URL}/${ticker}.png`,
                }}
              >
                {ticker.substring(0, 2).toUpperCase()}
              </Avatar>
              <Text fontSize='24px' fontWeight='semibold'>
                {availableBalance} {ticker}
              </Text>
            </VStack>
            {tokenDetails ? (
              <HStack
                space='8px'
                pt='16px'
                flexWrap='wrap'
                justifyContent='center'
              >
                <Pill
                  label='Price'
                  value={formatSatoshisAsDoge(tokenDetails.floorPrice, 3)}
                />
                <Pill
                  label='Volume'
                  value={formatSatoshisAsDoge(tokenDetails.volume, 3)}
                />
                <Pill
                  label='Minted/Supply'
                  value={`${Number(
                    tokenDetails.currentSupply
                  ).toLocaleString()} / ${Number(
                    tokenDetails.maxSupply
                  ).toLocaleString()}`}
                />
              </HStack>
            ) : (
              <Spinner
                color='amber.400'
                pl='8px'
                transform={[{ translateY: 4 }]}
              />
            )}
            <HStack justifyContent='space-between' w='100%'>
              <Text color='gray.500'>Confirmations </Text>
            </HStack>
            <HStack justifyContent='space-between' w='100%' pt='6px'>
              <Text color='gray.500'>Timestamp </Text>
            </HStack>
            <Box pt='32px'>
              <BigButton variant='secondary' px='28px'>
                Transfer{' '}
                <BiTransfer
                  style={{
                    paddingTop: '1px',
                  }}
                />
              </BigButton>
            </Box>
          </VStack>
        </Modal.Body>
      </Modal.Content>
    </Modal>
  );
};

function Pill({ label, value }) {
  if (!value) return null;
  return (
    <Box
      backgroundColor='gray.200'
      borderRadius='8px'
      paddingX='8px'
      paddingY='1px'
      flexDir='row'
      my='2px'
    >
      <Text fontWeight='bold' fontSize='12px'>
        {label}:{' '}
      </Text>
      <Text fontWeight='medium' fontSize='12px'>
        {value}
      </Text>
    </Box>
  );
}
