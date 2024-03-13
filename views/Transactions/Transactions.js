import dayjs from 'dayjs';
import {
  Avatar,
  Box,
  Button,
  Center,
  FlatList,
  Heading,
  HStack,
  Modal,
  Pressable,
  Spinner,
  Text,
  VStack,
} from 'native-base';
import { Fragment, useCallback, useState } from 'react';
import { FiArrowUpRight, FiCopy } from 'react-icons/fi';
import TimeAgo from 'timeago-react';

import { BigButton } from '../../components/Button';
import { WalletDetailModal } from '../../components/Header/WalletDetailModal';
import { Layout } from '../../components/Layout';
import { useAppContext } from '../../hooks/useAppContext';
import { useCopyText } from '../../hooks/useCopyText';
import { formatSatoshisAsDoge, is69, is420 } from '../../utils/formatters';
import { ActionButton } from './components/ActionButton';
import { Balance } from './components/Balance';
import { useTransactions } from './Transactions.hooks';

const Buy = 'assets/buy.svg';
const Receive = 'assets/receive.svg';
const Send = 'assets/send.svg';

export function Transactions() {
  const { balance, usdValue, transactions, loading, hasMore, fetchMore } =
    useTransactions();

  const { wallet, selectedAddressIndex, navigate } = useAppContext();

  const [addressDetailOpen, setAddressDetailOpen] = useState(false);

  const renderItem = useCallback(
    ({ item }) => <Transaction transaction={item} />,
    []
  );

  const openReceiveModal = useCallback(() => {
    setAddressDetailOpen(true);
  }, []);

  const [walletAddress] = wallet.addresses;

  const onBuy = useCallback(() => {
    window.open(`https://buy.getdoge.com/?addr=${walletAddress}`);
  }, [walletAddress]);

  const activeAddress = wallet.addresses[selectedAddressIndex];
  const activeAddressNickname =
    wallet.nicknames?.[activeAddress] ?? `Address ${selectedAddressIndex + 1}`;

  return (
    <Layout withHeader withConnectStatus p={0}>
      <Box pt='60px'>
        <Balance balance={balance} usdValue={usdValue} />
        <Center>
          <HStack space='24px' pt='16px'>
            <ActionButton icon={Buy} label='Buy' onPress={onBuy} />

            <ActionButton
              icon={Receive}
              label='Receive'
              onPress={openReceiveModal}
            />

            <ActionButton
              icon={Send}
              label='Send'
              onPress={() => navigate('Send')}
            />
          </HStack>
        </Center>
        <Box flex={1}>
          {transactions === undefined ? (
            <Center pt='40px'>
              <Spinner color='amber.400' />
            </Center>
          ) : transactions.length <= 0 ? (
            <VStack pt='48px' alignItems='center'>
              <Text color='gray.500' pt='24px' pb='32px'>
                No transactions found
              </Text>
              <Text fontSize='16px'>
                To get started, send DOGE to your wallet
              </Text>
              <BigButton mt='24px' onPress={onBuy}>
                Buy DOGE
              </BigButton>
              <BigButton mt='18px' onPress={openReceiveModal}>
                Deposit DOGE
              </BigButton>
            </VStack>
          ) : (
            <>
              <Center
                alignItems='center'
                justifyContent='center'
                mt='24px'
                mb='24px'
              >
                <Heading size='md'>Transactions</Heading>
              </Center>
              <Box px='10px'>
                <VStack space='10px'>
                  <FlatList
                    data={transactions}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id}
                  />
                  {hasMore ? (
                    <Button
                      variant='unstyled'
                      my='12px'
                      _hover={{ bg: 'gray.200' }}
                      alignSelf='center'
                      bg='gray.100'
                      onPress={fetchMore}
                      isDisabled={loading}
                      alignItems='center'
                    >
                      <Text color='gray.500' alignItems='center'>
                        View more
                        {loading ? (
                          <Spinner
                            color='amber.400'
                            pl='8px'
                            transform={[{ translateY: 4 }]}
                          />
                        ) : null}
                      </Text>
                    </Button>
                  ) : null}
                </VStack>
              </Box>
            </>
          )}
        </Box>
      </Box>
      <WalletDetailModal
        showModal={addressDetailOpen}
        onClose={() => setAddressDetailOpen(false)}
        addressNickname={activeAddressNickname}
        wallet={wallet}
        allowEdit={false}
        address={activeAddress}
      />
    </Layout>
  );
}

const TransactionModal = ({
  isOpen,
  onClose,
  address,
  type,
  amount,
  blockTime,
  id,
  confirmations,
}) => {
  const { copyTextToClipboard, textCopied } = useCopyText({ text: address });
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
            <HStack justifyContent='space-between' w='100%'>
              <Text color='gray.500'>Confirmations </Text>
              <Text>{confirmations}</Text>
            </HStack>
            <HStack justifyContent='space-between' w='100%' pt='6px'>
              <Text color='gray.500'>Timestamp </Text>
              <Text>
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

const Transaction = ({
  transaction: { address, id, blockTime, type, amount, confirmations },
}) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <Fragment key={id}>
      <Pressable onPress={() => setIsOpen(true)} paddingTop='10px'>
        <HStack p='2px'>
          <VStack mr='12px'>
            <Avatar
              size='sm'
              bg='brandYellow.500'
              _text={{ color: 'gray.800' }}
            >
              {address.substring(0, 2)}
            </Avatar>
          </VStack>
          <VStack flex={1}>
            <Text fontSize='xs' fontWeight='medium'>
              {address.slice(0, 8)}...{address.slice(-4)}
            </Text>

            <Text
              fontSize='12px'
              fontWeight='semibold'
              _light={{ color: 'gray.400' }}
              _dark={{ color: 'gray.500' }}
            >
              {confirmations === 0 ? (
                'PENDING'
              ) : (
                <TimeAgo datetime={blockTime * 1000} />
              )}
            </Text>
          </VStack>
          <VStack flexDirection='row' alignItems='flex-start' ml='8px'>
            <HStack
              _light={{
                bg: type === 'outgoing' ? '#E4F0FF' : '#E0F8E8',
              }}
              _dark={{
                bg: type === 'outgoing' ? '#000643' : '#001109',
              }}
              px='12px'
              py='3px'
              rounded='2xl'
            >
              <Text
                fontSize='12px'
                fontWeight='bold'
                _light={{
                  color: is420(formatSatoshisAsDoge(amount, 3))
                    ? 'green.600'
                    : type === 'outgoing'
                    ? 'blue.500'
                    : 'green.500',
                }}
                _dark={{
                  color: is420(formatSatoshisAsDoge(amount, 3))
                    ? 'green.300'
                    : type === 'outgoing'
                    ? 'blue.400'
                    : 'green.500',
                }}
              >
                {type === 'outgoing' ? '-' : '+'}{' '}
                {formatSatoshisAsDoge(amount, 3)}
              </Text>
              <Text fontSize='sm' fontWeight='bold'>
                {is69(formatSatoshisAsDoge(amount, 3)) && ' 😏'}
              </Text>
            </HStack>
          </VStack>
        </HStack>
      </Pressable>
      <TransactionModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        address={address}
        type={type}
        amount={amount}
        blockTime={blockTime}
        id={id}
        confirmations={confirmations}
      />
    </Fragment>
  );
};
