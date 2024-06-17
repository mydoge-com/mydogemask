import moment from 'moment';
import { useEffect, useState } from 'react';
import { VStack, useToast, HStack, Text} from 'native-base';
import { BLOCK_STREAM_URL } from '../../scripts/helpers/constants';
import { FiCheckCircle, FiFileText, FiCopy } from "react-icons/fi";
import { copyToClipboard, drcToDec, shortAddress } from '../../scripts/helpers/cardinals';
import { useAppContext } from '../../hooks/useAppContext';
import HeaderWithBackButton from './components/HeaderWithBackButton';
export const TransferDetailScreen = () => {
  const { wallet, selectedAddressIndex, navigate, routeParams} = useAppContext();
  const walletAddress = wallet.addresses[selectedAddressIndex];
  const toast = useToast();
  const [detailInfo, setDetailInfo] = useState({});
  useEffect(() => {
    const result = routeParams?.group
    result.time = moment.unix(routeParams.group.create_date).format('YYYY-MM-DD HH:mm:ss')
    setDetailInfo(result)
  }, [routeParams])
  return (
    <VStack px="20px" pt="20px">
      <HeaderWithBackButton 
        title="Transfer Detail" 
        onBackPress={() => navigate('Drc20TransferHistory')} 
      />
      <VStack>
        <VStack alignItems="center" my="10px">
          {
            detailInfo?.block_hash && (detailInfo?.fee_tx_hash || detailInfo?.drc20_tx_hash)
              ? 
                <FiCheckCircle color='#54a937' size='22px'/>
              : <FiFileText color='brandYellow.500' size='22px'/>
          }
          {
            !detailInfo?.block_hash && !detailInfo?.fee_tx_hash && <Text fontWeight='bold' color='brandYellow.500'>{'Pending'}</Text>
          }
          {
            detailInfo?.block_hash && (detailInfo?.fee_tx_hash || detailInfo?.drc20_tx_hash) && <Text fontWeight='bold' color='#54a937'>{'Completed'}</Text>
          }
          {
            !detailInfo?.block_hash && (detailInfo?.fee_tx_hash ||detailInfo?.drc20_tx_hash) && <Text fontWeight='bold' color='brandYellow.500'>{'In-progress'}</Text>
          }
        </VStack>
        {
          detailInfo?.tick?.length > 8 
            ? <VStack alignItems="center">
              <HStack>
                <Text fontWeight='bold' color="brandYellow.500">{`${detailInfo?.receive_address === walletAddress ? '-' : '+'}`}</Text>
                <Text fontWeight='bold' color="brandYellow.500">{drcToDec(detailInfo?.amt * detailInfo?.to_address?.split(',')?.length)}</Text>
              </HStack>
              <Text fontWeight='bold' color="brandYellow.500">{detailInfo?.tick}</Text>
            </VStack>
            : <HStack alignItems="center">
              <Text fontWeight='bold' color="brandYellow.500">{`${detailInfo?.receive_address === walletAddress ? '-' : '+'}`}</Text>
              <Text fontWeight='bold' color="brandYellow.500">{drcToDec(detailInfo?.amt * detailInfo?.to_address?.split(',')?.length)}</Text>
              <Text fontWeight='bold' color="brandYellow.500">{detailInfo?.tick}</Text>
            </HStack>
        }
        
        <VStack mt="20px">
          <VStack mb="14px">
            <Text color='gray.500'>{'Send address'}</Text>
            <HStack
              alignItems="center"
              onClick={() => {
                copyToClipboard(detailInfo?.receive_address).then(() => {
                  toast.show({
                    title: 'Copied'
                  });
                });
              }}>
              <Text mr="10px">{detailInfo?.receive_address}</Text>
              <FiCopy />
            </HStack>
          </VStack>
          <VStack mb="14px">
            <Text color='gray.500'>{"Receive address"}</Text>
            <HStack
              alignItems="center"
              onClick={(e) => {
                copyToClipboard(detailInfo?.to_address).then(() => {
                  toast.show({
                    title: 'Copied'
                  });
                });
              }}>
              <Text mr="10px">{detailInfo?.to_address}</Text>
              <FiCopy />
            </HStack>
          </VStack>
        </VStack>
        <VStack mb="14px">
          <Text color='gray.500'>{'Order id'}</Text>
          <HStack
            alignItems="center"
            onClick={() => {
              copyToClipboard(detailInfo?.order_id).then(() => {
                toast.show({
                  title: 'Copied'
                });
              });
            }}>
            <Text mr="10px">{detailInfo?.order_id}</Text>
            <FiCopy />
          </HStack>
        </VStack>
        <VStack mb="14px">
          <Text color='gray.500'>{"Time"}</Text>
          <Text>{detailInfo?.time}</Text>
        </VStack>
        {
          detailInfo?.drc20_tx_hash &&
          <VStack mb="14px">
            <Text color='gray.500'>{"Transaction hash"}</Text>
            <Text onClick={() => {
              window.open(`${BLOCK_STREAM_URL}/transaction/${detailInfo?.drc20_tx_hash}`);
            }}>{`${shortAddress(detailInfo?.drc20_tx_hash)}`}</Text>
          </VStack>
        }
        <VStack mb="14px">
          <Text color='gray.500'>{"Network"}</Text>
          <Text>{"Dogecoin"}</Text>
        </VStack>
      </VStack>
    </VStack>
  );
}