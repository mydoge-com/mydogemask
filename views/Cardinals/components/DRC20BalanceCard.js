import { drcToDec, formatNumberDecimal, priceFormat, satoshisToAmount } from '../../../scripts/helpers/cardinals';
import { VStack, HStack, Text, ScrollView } from 'native-base';

export const DRC20BalanceCard = ({
  tokenBalance,
  key,
  onClick
}) => {
  const { tick, amt, last_price, total_price } = tokenBalance;
  return (
    <ScrollView>
      <VStack justifyContent='space-between' style={{border: '1px solid rgb(253, 196, 28)', padding: '10px', borderRadius: '10px'}} my='4px'>
        <HStack justifyContent='space-between' style={{borderBottom: '1px solid rgb(253, 196, 28)'}} pb="8px" mb="8px">
          <Text bold color='brandYellow.500'>{tick}</Text>
          <Text color='brandYellow.500' bold>{drcToDec(amt)}</Text>
        </HStack>
        <VStack style={{ borderTopWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }} >
        {
          tick?.length > 10 && tick === 'WDOGE(WRAPPED-DOGE)'
            ? <HStack justifyContent='space-between'>
              <Text color="gray.500" bold>{'Ð1'}</Text>
              <Text color="gray.500" bold>{`Ð${formatNumberDecimal((satoshisToAmount(amt)), 4)}`}</Text>
            </HStack>
            : <HStack justifyContent='space-between'>
              <Text color="gray.500" bold>{`Ð${last_price > 0 ? priceFormat(satoshisToAmount(last_price)) : '0.0'}`}</Text>
              <Text color="gray.500" bold>{`Ð${last_price > 0 ? formatNumberDecimal(satoshisToAmount(last_price * satoshisToAmount(amt)), 4): '0.0'}`}</Text>
            </HStack>
        }
       </VStack>
        {
          <HStack justifyContent='space-between'>
            <Text color="gray.500">{`≈ $${+total_price > 0 ? priceFormat(total_price): '0.0'}`}</Text>
            <Text color="gray.500">{`≈ $${+total_price > 0 ? formatNumberDecimal((Number(total_price) * satoshisToAmount(amt)), 4) : '0.0'}`}</Text>
          </HStack>
        }
      </VStack>
    </ScrollView>
  );
};