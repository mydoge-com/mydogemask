import { HStack, Image, Pressable, Spinner, Text, VStack } from 'native-base';
import { useState } from 'react';

// import { useColorScheme } from 'react-native';
import { asFiat, formatSatoshisAsDoge } from '../../../utils/formatters';

const EyeDisabled = 'assets/eye-disabled.svg';
const EyeEnabled = 'assets/eye-enabled.svg';
const MydogeIcon = 'assets/mydoge-icon.svg';

export function Balance({ balance, usdValue }) {
  // const colorScheme = useColorScheme();
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
      />
      <VStack
        bg='yellow.100'
        borderRadius={20}
        pb='14px'
        alignItems='center'
        mt={36}
        pt='30px'
      >
        {balance === null ? <Spinner position='absolute' /> : null}
        <Text secondary fontWeight='700' color='black' fontSize='35px'>
          {balanceVisible
            ? typeof balance === 'number'
              ? `Ɖ${formatSatoshisAsDoge(balance, 3)}`
              : ' '
            : 'Ɖ******'}
        </Text>
        <HStack alignItems='center' justifyContent='center'>
          <Text secondary color='gray.500' fontWeight='500'>
            {balanceVisible
              ? typeof usdValue === 'number'
                ? `$${asFiat(usdValue, 2)}`
                : ' '
              : '$***.**'}
          </Text>

          {balance === null ? null : (
            <Pressable onPress={toggleBalanceVisibility} p='8px'>
              <VStack justifyContent='center'>
                {!balanceVisible ? (
                  <Image source={EyeEnabled} width='16px' height='12px' />
                ) : null}
                {balanceVisible ? (
                  <Image source={EyeDisabled} width='16px' height='16px' />
                ) : null}
              </VStack>
            </Pressable>
          )}
        </HStack>
      </VStack>
    </VStack>
  );
}
