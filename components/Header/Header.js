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
import { FiCheck, FiLock, FiSettings, FiTrash2 } from 'react-icons/fi';

import { useAppContext } from '../../hooks/useAppContext';
import { sendMessage } from '../../scripts/helpers/message';
import { ToastRender } from '../ToastRender';
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
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = useCallback(() => {
    setMenuOpen(!menuOpen);
  }, [menuOpen]);

  const onCloseModal = useCallback(() => {
    setOpenModal(null);
  }, []);

  const onGenerateAddress = useCallback(() => {
    sendMessage(
      { message: 'generateAddress' },
      ({ wallet: updatedWallet }) => {
        if (updatedWallet) {
          dispatch({ type: 'SET_WALLET', payload: { wallet: updatedWallet } });
          dispatch({
            type: 'SELECT_WALLET',
            payload: { index: updatedWallet.addresses.length - 1 },
          });
          Toast.show({
            duration: 3000,
            render: () => {
              return <ToastRender title='Address Generated' status='info' />;
            },
          });
        } else {
          Toast.show({
            title: 'Error',
            description: 'Failed to generate address',
            duration: 3000,
            render: () => {
              return (
                <ToastRender
                  title='Error'
                  description='Failed to generate address'
                  status='error'
                />
              );
            },
          });
        }
      },
      []
    );
  }, [dispatch]);

  const onDeleteAddress = useCallback(() => {
    const addressToDelete = wallet.addresses[currentWalletIndex];
    sendMessage(
      { message: 'deleteAddress', data: { index: currentWalletIndex } },
      ({ wallet: updatedWallet }) => {
        if (updatedWallet) {
          dispatch({ type: 'SET_WALLET', payload: { wallet: updatedWallet } });
          dispatch({
            type: 'SELECT_WALLET',
            payload: { index: 0 },
          });
          Toast.show({
            duration: 3000,
            render: () => {
              return (
                <ToastRender
                  title='Address Deleted'
                  description={`${addressToDelete} has been deleted`}
                  status='info'
                />
              );
            },
          });
        } else {
          Toast.show({
            duration: 3000,
            render: () => {
              return (
                <ToastRender
                  title='Error'
                  description='There was an error deleting the address'
                  status='error'
                />
              );
            },
          });
        }
      },
      []
    );
  }, [currentWalletIndex, dispatch, wallet.addresses]);

  const onSelectAddress = useCallback(
    (index) => {
      dispatch({ type: 'SELECT_WALLET', payload: { index } });
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
            <Pressable
              accessibilityLabel='Accounts menu'
              {...triggerProps}
              // onPress={toggleMenu}
            >
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
        closeOnSelect={false}
        // isOpen={menuOpen}
        zIndex={1}
      >
        <Text fontWeight='medium' fontSize='lg' pb='12px' px='12px'>
          My addresses
        </Text>
        {wallet.addresses.map((address, i) => {
          return (
            <Pressable
              px='12px'
              onPress={() => onSelectAddress(i)}
              key={address}
              _hover={{
                bg: 'rgba(0,0,0, 0.1)',
              }}
              bg={i === currentWalletIndex && 'rgba(0,0,0, 0.1)'}
            >
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
                    {address.slice(0, 8)}...{address.slice(-4)}
                  </Text>
                </VStack>
              </HStack>
            </Pressable>
          );
        })}
        <Divider my='6px' w='100%' />
        <MenuItem onPress={() => setOpenModal('WALLET_DETAIL')}>
          <Image
            source={{ uri: '/assets/wallet-import.png' }}
            size='18px'
            resizeMode='contain'
            alt='create-wallet'
          />
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
        <MenuItem onPress={onDeleteAddress}>
          <FiTrash2 size='20px' />
          Delete address
        </MenuItem>
        <Divider my='6px' w='100%' />
        <MenuItem onPress={() => setOpenModal('BACKUP_SECURITY')}>
          <FiSettings size='20px' />
          Backup & security
        </MenuItem>
        <MenuItem onPress={onSignOut}>
          <FiLock size='20px' />
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
