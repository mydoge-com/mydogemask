import { HStack, Image, Pressable, Spinner, Text, VStack } from 'native-base';
import { useCallback, useState } from 'react';
import sb from 'satoshi-bitcoin';

import { useInterval } from '../../../hooks/useInterval';
import { MESSAGE_TYPES } from '../../../scripts/helpers/constants';
import { sendMessage } from '../../../scripts/helpers/message';
import { logError } from '../../../utils/error';
import { asFiat, formatSatoshisAsDoge } from '../../../utils/formatters';

const EyeDisabled = 'assets/eye-disabled.svg';
const EyeEnabled = 'assets/eye-enabled.svg';
const MydogeIcon = 'assets/mydoge-icon.svg';

const QUERY_INTERVAL = 10000;

export function Balance({ walletAddress }) {
  const [balance, setBalance] = useState(null);
  const [usdPrice, setUSDPrice] = useState(0);

  const usdValue = balance ? sb.toBitcoin(balance) * usdPrice : 0;
  const getAddressBalance = useCallback(() => {
    sendMessage(
      {
        message: MESSAGE_TYPES.GET_ADDRESS_BALANCE,
        data: { address: walletAddress },
      },
      (walletBalance) => {
        if (walletBalance) {
          setBalance(Number(walletBalance));
        } else {
          logError(new Error('Failed to get wallet balance'));
        }
      }
    );
  }, [walletAddress]);

  const getDogecoinPrice = useCallback(() => {
    sendMessage({ message: MESSAGE_TYPES.GET_DOGECOIN_PRICE }, ({ usd }) => {
      if (usd) {
        setUSDPrice(usd);
      } else {
        logError(new Error('Failed to get Dogecoin price'));
      }
    });
  }, []);

  useInterval(
    () => {
      if (!walletAddress) {
        return;
      }
      getAddressBalance();
      getDogecoinPrice();
    },
    QUERY_INTERVAL,
    true
  );

  const [balanceVisible, setBalanceVisible] = useState(false);
  const toggleBalanceVisibility = () => setBalanceVisible((v) => !v);
  return (
    <VStack px='16px'>
      <Image
        src={MydogeIcon}
        width={66}
        height={66}
        position='absolute'
        top={0}
        alignSelf='center'
        zIndex={2}
        alt='Mydoge icon'
      />
      <VStack
        bg='yellow.100'
        borderRadius={20}
        pb='14px'
        alignItems='center'
        justifyContent={balance === null ? 'center' : 'flex-start'}
        mt={36}
        pt='30px'
        h='120px'
      >
        {balance === null ? (
          <Spinner alignSelf='center' />
        ) : (
          <>
            <Text secondary fontWeight='700' color='black' fontSize='35px'>
              {!balanceVisible
                ? typeof balance === 'number'
                  ? `Ɖ${formatSatoshisAsDoge(balance, 3)}`
                  : ' '
                : 'Ɖ******'}
            </Text>
            <HStack alignItems='center' justifyContent='center'>
              <Text secondary color='gray.500' fontWeight='500'>
                {!balanceVisible
                  ? typeof usdValue === 'number'
                    ? `$${asFiat(usdValue, 2)}`
                    : ' '
                  : '$***.**'}
              </Text>

              {balance === null ? null : (
                <Pressable onPress={toggleBalanceVisibility} p='8px'>
                  <VStack justifyContent='center'>
                    {balanceVisible ? (
                      <Image
                        source={EyeEnabled}
                        width='16px'
                        height='12px'
                        alt='show balance'
                      />
                    ) : null}
                    {!balanceVisible ? (
                      <Image
                        source={EyeDisabled}
                        width='16px'
                        height='16px'
                        alt='hide balance'
                      />
                    ) : null}
                  </VStack>
                </Pressable>
              )}
            </HStack>
          </>
        )}
      </VStack>
    </VStack>
  );
}
