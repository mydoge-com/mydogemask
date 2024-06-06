import { Avatar, Box, HStack, Modal, Spinner, Text, VStack } from 'native-base';
import { useCallback, useEffect, useState } from 'react';
import { BiTransfer } from 'react-icons/bi';

import { BigButton } from '../../../components/Button';
import { DISPATCH_TYPES } from '../../../Context';
import { useAppContext } from '../../../hooks/useAppContext';
import { doginalsMarketplace } from '../../../scripts/api';
import { TICKER_ICON_URL } from '../../../scripts/helpers/constants';
import { logError } from '../../../utils/error';
import { formatSatoshisAsDoge } from '../../../utils/formatters';

export const TokenModal = ({
  isOpen,
  onClose,
  token: { availableBalance, overallBalance, ticker, transferableBalance },
  token,
}) => {
  const { dispatch, navigate } = useAppContext();
  const [tokenDetails, setTokenDetails] = useState();

  const fetchTokenDetails = useCallback(() => {
    doginalsMarketplace
      .get(`/drc20/data?tick=${ticker}`)
      .json((res) => {
        setTokenDetails(res);
      })
      .catch(logError);
  }, [ticker]);

  useEffect(() => {
    if (isOpen) {
      fetchTokenDetails();
    }
  }, [fetchTokenDetails, isOpen]);

  const onGetAvailable = useCallback(() => {
    dispatch({
      type: DISPATCH_TYPES.SELECT_TOKEN,
      payload: {
        token: {
          ...token,
          dogePrice: Number(
            formatSatoshisAsDoge(Math.ceil(tokenDetails?.floorPrice), 8)
          ),
        },
      },
    });
    navigate('TransferAvailable');
  }, [dispatch, navigate, token, tokenDetails?.floorPrice]);

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
                {Number(overallBalance).toLocaleString()} {ticker}
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
                  value={`Ɖ ${formatSatoshisAsDoge(
                    Math.round(tokenDetails.floorPrice)
                  )}`}
                />
                <Pill
                  label='Volume'
                  value={`Ɖ ${formatSatoshisAsDoge(tokenDetails.volume)}`}
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
            <VStack space='12px' w='100%' alignItems='flex-start' py='30px'>
              <HStack justifyContent='space-between' w='100%'>
                <Text color='gray.700' fontSize='16px' fontWeight='semibold'>
                  Available balance:{' '}
                </Text>
                <Text color='gray.700' ontSize='16px'>
                  {Number(availableBalance).toLocaleString()}
                </Text>
              </HStack>
              <HStack justifyContent='space-between' w='100%'>
                <Text color='gray.700' fontSize='16px' fontWeight='semibold'>
                  Transferable balance:{' '}
                </Text>
                <Text color='gray.700' fontSize='16px'>
                  {Number(transferableBalance).toLocaleString()}
                </Text>
              </HStack>
            </VStack>
            <BigButton
              isDisabled={availableBalance === '0'}
              onPress={onGetAvailable}
              variant='secondary'
              px='28px'
              mt='30px'
            >
              Get Available{' '}
              <BiTransfer
                style={{
                  paddingTop: '1px',
                }}
              />
            </BigButton>
            <BigButton
              isDisabled={transferableBalance === '0'}
              variant='secondary'
              px='28px'
              mt='30px'
            >
              Transfer{' '}
              <BiTransfer
                style={{
                  paddingTop: '1px',
                }}
              />
            </BigButton>
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
      <Text fontWeight='bold' fontSize='11px'>
        {label}:{' '}
      </Text>
      <Text fontWeight='medium' fontSize='11px'>
        {value}
      </Text>
    </Box>
  );
}
