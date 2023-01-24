import {
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
import { useCallback, useRef, useState } from 'react';
import { FiCheck, FiLock, FiSettings, FiTrash2 } from 'react-icons/fi';
import { MdQrCode2 } from 'react-icons/md';

import { useAppContext } from '../../hooks/useAppContext';
import { MESSAGE_TYPES } from '../../scripts/helpers/constants';
import { sendMessage } from '../../scripts/helpers/message';
import { BackButton } from '../BackButton';
import { ToastRender } from '../ToastRender';
import { DeleteAddressModal } from './DeleteAddressModal';
import { SecurityModal } from './SecurityModal';
import { WalletDetailModal } from './WalletDetailModal';

export const Header = ({ withBackButton, backRoute, onBack }) => {
  const { wallet, selectedAddressIndex, dispatch, navigate } = useAppContext();
  const onSignOut = useCallback(() => {
    sendMessage(
      { message: MESSAGE_TYPES.SIGN_OUT },
      () => {
        dispatch({ type: 'SIGN_OUT' });
      },
      []
    );
  }, [dispatch]);

  const [openModal, setOpenModal] = useState(null);

  const onCloseModal = useCallback(() => {
    setOpenModal(null);
    openMenu.current?.();
  }, []);

  const onGenerateAddress = useCallback(() => {
    sendMessage(
      { message: MESSAGE_TYPES.GENERATE_ADDRESS },
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
              return (
                <ToastRender description='Address Generated' status='success' />
              );
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
        scrollRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
        openMenu.current?.();
      },
      []
    );
  }, [dispatch]);

  const onSelectAddress = useCallback(
    (index) => {
      dispatch({ type: 'SELECT_WALLET', payload: { index } });
    },
    [dispatch]
  );

  const scrollRef = useRef(null);
  const openMenu = useRef(null);

  return (
    <HStack
      alignItems='center'
      bg='rgba(255,255,255, 0.1)'
      position='absolute'
      zIndex={1}
      w='100%'
      py='8px'
      px='12px'
      justifyContent='flex-end'
    >
      {withBackButton ? (
        <BackButton
          position='absolute'
          left='12px'
          pt='8px'
          onPress={() => {
            if (onBack) {
              onBack();
            } else {
              navigate(backRoute);
            }
          }}
        />
      ) : null}
      <Menu
        minW='250px'
        trigger={({ onPress, ...triggerProps }) => {
          openMenu.current = onPress;
          return (
            <Pressable
              accessibilityLabel='Accounts menu'
              {...triggerProps}
              onPress={openMenu.current}
            >
              <Avatar
                source={{
                  uri: '/assets/default-avatar.png',
                }}
                size='36px'
                alt='Avatar'
              />
            </Pressable>
          );
        }}
        rounded='md'
      >
        <VStack maxH='500px'>
          <Text fontWeight='medium' fontSize='lg' pb='12px' px='12px'>
            My addresses
          </Text>
          <VStack
            flexShrink={1}
            overflowY='scroll'
            style={{
              scrollbarWidth: 'none',
            }}
            scrollbarWidth='none'
          >
            {wallet.addresses.map((address, i) => {
              return (
                <Pressable
                  px='12px'
                  onPress={() => onSelectAddress(i)}
                  key={address}
                  _hover={{
                    bg: 'rgba(0,0,0, 0.1)',
                  }}
                  bg={i === selectedAddressIndex && 'rgba(0,0,0, 0.1)'}
                >
                  <HStack alignItems='center'>
                    <Box w='30px'>
                      {i === selectedAddressIndex ? (
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
            <div ref={scrollRef} />
          </VStack>
          <Divider my='6px' w='100%' />
          <MenuItem onPress={() => setOpenModal('WALLET_DETAIL')}>
            <MdQrCode2 size='20px' alt='Receive Dogecoin' />
            Receive Dogecoin
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
          {/* <MenuItem
            onPress={() => setOpenModal('DELETE_ADDRESS')}
            isDisabled={
              wallet.addresses.length === 1 || selectedAddressIndex === 0
            }
          >
            <FiTrash2 size='20px' alt='Delete address' />
            Delete address
          </MenuItem> */}
          <Divider my='6px' w='100%' />
          <MenuItem onPress={() => setOpenModal('BACKUP_SECURITY')}>
            <FiSettings size='20px' alt='Backup & security' />
            Backup & security
          </MenuItem>
          <MenuItem onPress={onSignOut}>
            <FiLock size='20px' alt='Lock' />
            Lock
          </MenuItem>
        </VStack>
      </Menu>

      <WalletDetailModal
        showModal={openModal === 'WALLET_DETAIL'}
        onClose={onCloseModal}
        walletName={`Address ${selectedAddressIndex + 1}`}
        address={wallet.addresses[selectedAddressIndex]}
      />
      <SecurityModal
        showModal={openModal === 'BACKUP_SECURITY'}
        onClose={onCloseModal}
      />
      <DeleteAddressModal
        showModal={openModal === 'DELETE_ADDRESS'}
        onClose={onCloseModal}
        selectedAddressIndex={selectedAddressIndex}
      />
    </HStack>
  );
};

const MenuItem = ({ children, ...props }) => (
  <Menu.Item flexDirection='row' gap='8px' alignItems='center' {...props}>
    {children}
  </Menu.Item>
);
