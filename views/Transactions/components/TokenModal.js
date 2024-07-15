import {
  Avatar,
  Box,
  HStack,
  Modal,
  Popover,
  Pressable,
  Spinner,
  Text,
  VStack,
} from 'native-base';
import { useCallback, useEffect, useState } from 'react';
import { BiTransferAlt } from 'react-icons/bi';
import { BsInfoCircleFill } from 'react-icons/bs';

import { BigButton } from '../../../components/Button';
import { useAppContext } from '../../../hooks/useAppContext';
import { doginalsMarketplace } from '../../../scripts/api';
import { TICKER_ICON_URL } from '../../../scripts/helpers/constants';
import { logError } from '../../../utils/error';
import { formatSatoshisAsDoge } from '../../../utils/formatters';

export const TokenModal = ({ isOpen, onClose, token }) => {
  const { navigate } = useAppContext();
  const [tokenDetails, setTokenDetails] = useState();

  const {
    overallBalance,
    availableBalance,
    ticker,
    transferableBalance,
    pendingInscriptionAmount,
  } = token ?? {};

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

  const onInscribeToken = useCallback(() => {
    navigate(
      `/InscribeToken/?selectedToken=${JSON.stringify({
        ...token,
        dogePrice: Number(
          formatSatoshisAsDoge(Math.ceil(tokenDetails?.floorPrice), 8)
        ),
      })}`
    );
  }, [navigate, token, tokenDetails?.floorPrice]);

  const onTransfer = useCallback(() => {
    navigate(
      `/TransferToken/?selectedToken=${JSON.stringify({
        ...token,
        dogePrice: Number(
          formatSatoshisAsDoge(Math.ceil(tokenDetails?.floorPrice), 8)
        ),
      })}`
    );
  }, [navigate, token, tokenDetails?.floorPrice]);

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        onClose();
        setTokenDetails(null);
      }}
      size='full'
    >
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
                {ticker?.substring(0, 2).toUpperCase()}
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
                  flexDir='column'
                  alignItems='center'
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
                <HStack space='4px' alignItems='center'>
                  <Text color='gray.700' fontSize='16px'>
                    {Number(transferableBalance).toLocaleString()}
                  </Text>
                  {pendingInscriptionAmount ? (
                    <Popover
                      trigger={(triggerProps) => {
                        return (
                          <Pressable {...triggerProps}>
                            <BsInfoCircleFill color='#FCD436' />
                          </Pressable>
                        );
                      }}
                    >
                      <Popover.Content>
                        <Popover.Arrow />
                        <Popover.Body>
                          <Text fontSize='13px'>
                            Pending token inscriptions affect your available
                            token balance.{'\n\n'}
                            Pending inscriptions:
                            {'\n'}
                            <Text fontWeight='bold'>
                              {token.ticker}{' '}
                              {Number(
                                pendingInscriptionAmount
                              ).toLocaleString()}
                            </Text>
                          </Text>
                        </Popover.Body>
                      </Popover.Content>
                    </Popover>
                  ) : null}
                </HStack>
              </HStack>
            </VStack>
            {Number(transferableBalance) ? (
              <HStack space='8px' mt='10px' alignItems='center'>
                <BigButton onPress={onTransfer} variant='primary' px='32px'>
                  Transfer <BiTransferAlt style={{ marginLeft: '4px' }} />
                </BigButton>
              </HStack>
            ) : null}

            {!Number(transferableBalance) ||
            Number(transferableBalance) < Number(overallBalance) ? (
              <HStack space='8px' mt='10px' alignItems='center'>
                <BigButton
                  onPress={onInscribeToken}
                  variant='secondary'
                  px='32px'
                >
                  Inscribe for Transfer{' '}
                  <BiTransferAlt style={{ marginLeft: '4px' }} />
                </BigButton>
                <Popover
                  trigger={(triggerProps) => {
                    return (
                      <Pressable
                        {...triggerProps}
                        position='absolute'
                        top='-8px'
                      >
                        <BsInfoCircleFill color='#bbbbbb' />
                      </Pressable>
                    );
                  }}
                >
                  <Popover.Content>
                    <Popover.Arrow />
                    <Popover.Body>
                      <Text fontSize='13px'>
                        Initiate the first step of transferring your{' '}
                        <Text fontWeight='bold'>{ticker}</Text> tokens. This
                        inscribes the token transfer intent on the Dogecoin
                        blockchain, making the inscribed amount of{' '}
                        <Text fontWeight='bold'>{ticker}</Text> available for
                        transfer.
                      </Text>
                    </Popover.Body>
                  </Popover.Content>
                </Popover>
              </HStack>
            ) : null}
          </VStack>
        </Modal.Body>
      </Modal.Content>
    </Modal>
  );
};

function Pill({ label, value, ...props }) {
  if (!value) return null;
  return (
    <Box
      backgroundColor='gray.200'
      borderRadius='8px'
      paddingX='8px'
      paddingY='1px'
      flexDir='row'
      my='2px'
      {...props}
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
