import {
  Avatar,
  Divider,
  HStack,
  Image,
  Menu,
  Pressable,
  Text,
  VStack,
} from 'native-base';
import { useCallback } from 'react';
import { FiLock, FiSettings } from 'react-icons/fi';

import { useAppContext } from '../../../hooks/useAppContext';
import { sendMessage } from '../../../scripts/helpers/message';

export const Header = () => {
  const { wallet, dispatch } = useAppContext();
  const onSignOut = useCallback(() => {
    sendMessage(
      { message: 'signOut' },
      () => {
        dispatch({ type: 'SIGN_OUT' });
      },
      []
    );
  }, [dispatch]);
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
        minW='200px'
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
      >
        <Text fontWeight='medium' fontSize='lg' pb='6px' px='12px'>
          My wallets
        </Text>
        <Divider my='6px' w='100%' />
        {wallet.addresses.map((address, i) => {
          return (
            <Pressable px='12px'>
              <HStack alignItems='center'>
                <Avatar
                  source={{
                    uri: '/assets/default-avatar.png',
                  }}
                  size='30px'
                  mr='12px'
                />
                <VStack>
                  <Text fontSize='md' fontWeight='medium'>
                    Account {i + 1}
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
        <MenuItem onPress={onSignOut}>
          <FiLock />
          Lock
        </MenuItem>
        <Divider my='6px' w='100%' />
        <MenuItem>
          <Image
            source={{ uri: '/assets/wallet-create.png' }}
            size='18px'
            resizeMode='contain'
            alt='create-wallet'
          />
          Create wallet
        </MenuItem>
        <MenuItem>
          <Image
            source={{ uri: '/assets/wallet-import.png' }}
            size='18px'
            resizeMode='contain'
            alt='create-wallet'
          />
          Import wallet
        </MenuItem>
        <Divider my='6px' w='100%' />
        <MenuItem>
          <FiSettings />
          Settings
        </MenuItem>
      </Menu>
    </HStack>
  );
};

const MenuItem = ({ children, ...props }) => (
  <Menu.Item flexDirection='row' gap='8px' {...props}>
    {children}
  </Menu.Item>
);
