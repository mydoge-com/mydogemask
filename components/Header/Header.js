import {
  Alert,
  Avatar,
  Box,
  Divider,
  HStack,
  Image,
  Menu,
  Pressable,
  Text,
  Toast,
  VStack,
} from 'native-base';
import { useCallback, useState } from 'react';
import { FiCheck, FiGrid, FiLock, FiSettings } from 'react-icons/fi';

import { useAppContext } from '../../hooks/useAppContext';
import { sendMessage } from '../../scripts/helpers/message';
import { SecurityModal } from './SecurityModal';
import { WalletDetailModal } from './WalletDetailModal';

export const Header = () => {
  const { wallet, currentWalletIndex, dispatch } = useAppContext();
  const onSignOut = useCallback(() => {
    sendMessage(
      { message: 'signOut' },
      () => {
        dispatch({ type: 'SIGN_OUT' });
      },
      []
    );
  }, [dispatch]);

  const [openModal, setOpenModal] = useState(null);
  const [closeOnSelect, setCloseOnSelect] = useState(true);

  const onCloseModal = useCallback(() => {
    setOpenModal(null);
  }, []);

  const onGenerateAddress = useCallback(() => {
    setCloseOnSelect(false);
    sendMessage(
      { message: 'generateAddress' },
      ({ wallet: updatedWallet }) => {
        if (updatedWallet) {
          dispatch({ type: 'SET_WALLET', payload: { wallet: updatedWallet } });
          setCloseOnSelect(true);
        } else {
          Toast.show({
            title: 'Error',
            description: 'Failed to generate address',
            duration: 3000,
            render: () => {
              return (
                <Alert w='100%' status='error'>
                  <HStack
                    flexShrink={1}
                    space={2}
                    justifyContent='space-between'
                  >
                    <Alert.Icon mt='1' />
                    <Text fontSize='md' color='coolGray.800'>
                      Failed to generate address
                    </Text>
                  </HStack>
                </Alert>
              );
            },
          });
        }
      },
      []
    );
  }, [dispatch]);

  const onSelectAddress = useCallback(
    (index) => {
      setCloseOnSelect(false);
      dispatch({ type: 'SELECT_WALLET', payload: { index } });
      setTimeout(() => setCloseOnSelect(true));
    },
    [dispatch]
  );

  return (
    <HStack
      alignItems='center'
      bg='rgba(255,255,255, 0.1)'
      position='absolute'
      zIndex={99}
      w='100%'
      py='8px'
      px='12px'
      justifyContent='flex-end'
    >
      <Menu
        minW='250px'
        trigger={(triggerProps) => {
          return (
            <Pressable accessibilityLabel='Accounts menu' {...triggerProps}>
              <Avatar
                source={{
                  uri: '/assets/default-avatar.png',
                }}
                size='36px'
              />
            </Pressable>
          );
        }}
        rounded='md'
        closeOnSelect={closeOnSelect}
      >
        <Text fontWeight='medium' fontSize='lg' pb='12px' px='12px'>
          My addresses
        </Text>
        {wallet.addresses.map((address, i) => {
          return (
            <Pressable px='12px' onPress={() => onSelectAddress(i)}>
              <HStack alignItems='center'>
                <Box w='30px'>
                  {i === currentWalletIndex ? (
                    <FiCheck color='#54a937' size='22px' />
                  ) : null}
                </Box>
                <Avatar
                  source={{
                    uri: '/assets/default-avatar.png',
                  }}
                  size='30px'
                  mr='12px'
                />
                <VStack>
                  <Text fontSize='md' fontWeight='medium'>
                    Address {i + 1}
                  </Text>
                  <Text fontSize='sm' color='gray.500'>
                    {address.slice(0, 5)}...{address.slice(-4)}
                  </Text>
                </VStack>
              </HStack>
            </Pressable>
          );
        })}
        <Divider my='6px' w='100%' />
        <MenuItem onPress={() => setOpenModal('WALLET_DETAIL')}>
          <FiGrid size='18px' />
          Receive dogecoin
        </MenuItem>
        <Divider my='6px' w='100%' />
        <MenuItem onPress={onGenerateAddress}>
          <Image
            source={{ uri: '/assets/wallet-create.png' }}
            size='18px'
            resizeMode='contain'
            alt='create-wallet'
          />
          Create address
        </MenuItem>
        <Divider my='6px' w='100%' />
        <MenuItem onPress={() => setOpenModal('BACKUP_SECURITY')}>
          <FiSettings />
          Backup & security
        </MenuItem>
        <MenuItem onPress={onSignOut}>
          <FiLock />
          Lock
        </MenuItem>
      </Menu>

      <WalletDetailModal
        showModal={openModal === 'WALLET_DETAIL'}
        onClose={onCloseModal}
        walletName={`Address ${currentWalletIndex + 1}`}
        address={wallet.addresses[currentWalletIndex]}
      />
      <SecurityModal
        showModal={openModal === 'BACKUP_SECURITY'}
        onClose={onCloseModal}
      />
    </HStack>
  );
};

const MenuItem = ({ children, ...props }) => (
  <Menu.Item flexDirection='row' gap='8px' alignItems='center' {...props}>
    {children}
  </Menu.Item>
);
