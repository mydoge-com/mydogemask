import moment from 'moment';
import { useEffect, useState } from 'react';
import { VStack, useToast, HStack, Text } from 'native-base';
import { BLOCK_STREAM_URL } from '../../scripts/helpers/constants';
import { FiCheckCircle, FiFileText, FiCopy } from "react-icons/fi";
import { copyToClipboard, drcToDec, shortAddress } from '../../scripts/helpers/cardinals';
import { useAppContext } from '../../hooks/useAppContext';
import HeaderWithBackButton from './components/HeaderWithBackButton';
import { useLocation } from "react-router-dom";

export const TransferDetailScreen = () => {
  const location = useLocation();
  const { group } = location.state || {};
  const { wallet, selectedAddressIndex, navigate, routeParams } = useAppContext();
  const walletAddress = wallet.addresses[selectedAddressIndex];
  const toast = useToast();
  const [detailInfo, setDetailInfo] = useState({});

  useEffect(() => {
    const result = { ...group, time: moment.unix(group.create_date).format('YYYY-MM-DD HH:mm:ss') };
    setDetailInfo(result);
  }, [routeParams, group]);

  const handleCopy = (text) => {
    copyToClipboard(text).then(() => {
      toast.show({ title: 'Copied' });
    });
  };

  const renderStatusIcon = () => {
    if (detailInfo?.block_hash && (detailInfo?.fee_tx_hash || detailInfo?.drc20_tx_hash)) {
      return <FiCheckCircle color='rgb(34, 197, 94)' size='30px' />;
    }
    return <FiFileText color='rgb(253, 196, 28)' size='30px' />;
  };

  const renderStatusText = () => {
    if (!detailInfo?.block_hash && !detailInfo?.fee_tx_hash) {
      return <Text fontWeight='bold' fontSize='15px' color='brandYellow.500'>{'Pending'}</Text>;
    }
    if (detailInfo?.block_hash && (detailInfo?.fee_tx_hash || detailInfo?.drc20_tx_hash)) {
      return <Text fontWeight='bold' fontSize='15px' color='green.500'>{'Completed'}</Text>;
    }
    return <Text fontWeight='bold' fontSize='15px' color='brandYellow.500'>{'In-progress'}</Text>;
  };

  const renderAmount = () => {
    const amount = drcToDec(detailInfo?.amt * detailInfo?.to_address?.split(',')?.length);
    const sign = detailInfo?.receive_address === walletAddress ? '-' : '+';
    return (
      <HStack alignItems="center" justifyContent="center">
        <Text fontWeight='bold'>{sign}</Text>
        <Text fontWeight='bold'>{amount}</Text>
        {detailInfo?.tick?.length > 8 && <Text fontWeight='bold'>{detailInfo?.tick}</Text>}
      </HStack>
    );
  };

  return (
    <VStack px="20px" pt="20px">
      <HeaderWithBackButton title="Transfer Detail" onBackPress={() => navigate('TransferHistory')} />
      <VStack>
        <VStack alignItems="center" justifyContent="center" mt="20px" mb='10px'>
          {renderStatusIcon()}
          {renderStatusText()}
        </VStack>
        {renderAmount()}
        <VStack mt="20px">
          <VStack mb="14px">
            <Text color='gray.500' fontSize='12px' fontWeight='bold'>{'Send address'}</Text>
            <HStack alignItems="center" onClick={() => handleCopy(detailInfo?.receive_address)}>
              <Text mr="10px" fontSize='12px'>{detailInfo?.receive_address}</Text>
              <FiCopy size='14px'/>
            </HStack>
          </VStack>
          <VStack mb="14px">
            <Text color='gray.500' fontSize='12px' fontWeight='bold'>{"Receive address"}</Text>
            <HStack alignItems="center" onClick={() => handleCopy(detailInfo?.to_address)}>
              <Text mr="10px" fontSize='12px'>{detailInfo?.to_address}</Text>
              <FiCopy size='14px'/>
            </HStack>
          </VStack>
        </VStack>
        <VStack mb="14px">
          <Text color='gray.500' fontSize='12px' fontWeight='bold'>{'Order id'}</Text>
          <HStack alignItems="center" onClick={() => handleCopy(detailInfo?.order_id)}>
            <Text mr="10px" fontSize='12px'>{shortAddress(detailInfo?.order_id)}</Text>
            <FiCopy size='14px'/>
          </HStack>
        </VStack>
        <VStack mb="14px">
          <Text color='gray.500' fontSize='12px' fontWeight='bold'>{"Time"}</Text>
          <Text fontSize='12px'>{detailInfo?.time}</Text>
        </VStack>
        {detailInfo?.drc20_tx_hash && (
          <VStack mb="14px">
            <Text color='gray.500' fontSize='12px' fontWeight='bold'>{"Transaction hash"}</Text>
            <Text fontSize='12px' onClick={() => window.open(`${BLOCK_STREAM_URL}/transaction/${detailInfo?.drc20_tx_hash}`)} style={{ textDecoration: 'underline' }}>
              {shortAddress(detailInfo?.drc20_tx_hash)}
            </Text>
          </VStack>
        )}
        <VStack mb="14px">
          <Text color='gray.500' fontSize='12px' fontWeight='bold'>{"Network"}</Text>
          <Text fontSize='12px'>{"Dogecoin"}</Text>
        </VStack>
      </VStack>
    </VStack>
  );
};