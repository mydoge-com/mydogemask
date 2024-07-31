import { drcToDec, formatNumberDecimal, priceFormat, satoshisToAmount } from '../../../scripts/helpers/cardinals';
import { VStack, HStack, Text, ScrollView } from 'native-base';

export const BalanceCard = ({ tokenBalance, onClick }) => {
  const { tick, amt, last_price, total_price } = tokenBalance;

  const isWrappedDoge = tick?.length > 10 && tick === 'WDOGE(WRAPPED-DOGE)';
  const formattedAmt = formatNumberDecimal(satoshisToAmount(amt), 4);
  const formattedLastPrice = last_price > 0 ? priceFormat(satoshisToAmount(last_price)) : '0.0';
  const formattedTotalPrice = +total_price > 0 ? priceFormat(total_price) : '0.0';
  const formattedTotalPriceAmt = +total_price > 0 ? formatNumberDecimal(Number(total_price) * satoshisToAmount(amt), 4) : '0.0';

  const containerStyle = {
    border: '1px solid rgba(1, 1, 1, 0.1)',
    padding: '10px',
    borderRadius: '10px',
    marginBottom: '6px',
  };

  const headerStyle = {
    borderBottom: '1px solid rgba(1, 1, 1, 0.1)',
    paddingBottom: '8px',
    marginBottom: '8px'
  };

  const contentStyle = {
    borderTopWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)'
  };

  return (
    <ScrollView>
      <VStack justifyContent='space-between' style={containerStyle}>
        <HStack justifyContent='space-between' style={headerStyle}>
          <Text bold color='brandYellow.500' fontSize='12px'>{tick}</Text>
          <Text color='brandYellow.500' bold fontSize='12px'>{drcToDec(amt)}</Text>
        </HStack>
        <VStack style={contentStyle}>
          {isWrappedDoge ? (
            <HStack justifyContent='space-between'>
              <Text color="gray.500" bold fontSize='12px'>{'Ð1'}</Text>
              <Text color="gray.500" bold fontSize='12px'>{`Ð${formattedAmt}`}</Text>
            </HStack>
          ) : (
            <HStack justifyContent='space-between'>
              <Text color="gray.500" bold fontSize='12px'>{`Ð${formattedLastPrice}`}</Text>
              <Text color="gray.500" bold fontSize='12px'>{`Ð${last_price > 0 ? formatNumberDecimal(satoshisToAmount(last_price * satoshisToAmount(amt)), 4) : '0.0'}`}</Text>
            </HStack>
          )}
        </VStack>
        <HStack justifyContent='space-between'>
          <Text color="gray.500" fontSize='12px'>{`≈ $${formattedTotalPrice}`}</Text>
          <Text color="gray.500" fontSize='12px'>{`≈ $${formattedTotalPriceAmt}`}</Text>
        </HStack>
      </VStack>
    </ScrollView>
  );
};