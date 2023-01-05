import {
  Avatar,
  Box,
  Divider,
  HStack,
  Image,
  Menu,
  Modal,
  Pressable,
  Text,
  VStack,
} from 'native-base';
import { useCallback, useState } from 'react';
import { FiCheck, FiCopy, FiGrid, FiLock, FiSettings } from 'react-icons/fi';

import { BigButton } from '../../../components/Button';
import { useAppContext } from '../../../hooks/useAppContext';
import { sendMessage } from '../../../scripts/helpers/message';
import { logError } from '../../../utils/error';
import { QRCode } from './QRCode';

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

  const [walletDetailOpen, setWalletDetailOpen] = useState(false);

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
      >
        <Text fontWeight='medium' fontSize='lg' pb='12px' px='12px'>
          My wallets
        </Text>
        {wallet.addresses.map((address, i) => {
          return (
            <Pressable px='12px'>
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
                    Wallet {i + 1}
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
        <MenuItem onPress={() => setWalletDetailOpen(true)}>
          <FiGrid size='18px' />
          Wallet details
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
          Backup & security
        </MenuItem>
        <MenuItem onPress={onSignOut}>
          <FiLock />
          Lock
        </MenuItem>
      </Menu>

      <WalletDetailModal
        showModal={walletDetailOpen}
        onClose={() => setWalletDetailOpen(false)}
        walletName={`Wallet ${currentWalletIndex + 1}`}
        address={wallet.addresses[currentWalletIndex]}
      />
    </HStack>
  );
};

const MenuItem = ({ children, ...props }) => (
  <Menu.Item flexDirection='row' gap='8px' alignItems='center' {...props}>
    {children}
  </Menu.Item>
);

const WalletDetailModal = ({ showModal, onClose, walletName, address }) => {
  const [addressCopied, setAddressCopied] = useState(false);
  const onCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(address);
      setAddressCopied(true);
      setTimeout(() => setAddressCopied(false), 3000);
    } catch (e) {
      logError(e);
    }
  }, [address]);
  return (
    <Modal isOpen={showModal} onClose={onClose}>
      <Modal.Content maxWidth='500px' width='90%' h='auto' maxH='750px'>
        <Modal.CloseButton />
        <Modal.Body alignItems='center'>
          <Text textAlign='center' fontWeight='medium' fontSize='xl'>
            {walletName}
          </Text>
          <Box bg='white' rounded='44px' p='16px' pb='28px'>
            <Box
              p={{ base: '12px', sm: '12px' }}
              bg='white'
              rounded='36px'
              borderColor='black'
              borderWidth='4'
            >
              <QRCode
                value={address}
                size={200}
                avatarSource={{ uri: '/assets/default-avatar.png' }}
              />
              <Image
                source={{ uri: '/assets/mydoge-mask.png' }}
                w={120}
                h='32px'
                resizeMode='contain'
                alt='mydogemask'
                bg='white'
                ml='auto'
                mr='auto'
                position='absolute'
                bottom='-45px'
                left='50%'
                style={{
                  transform: [{ translateX: '-50%' }, { translateY: '-50%' }],
                }}
              />
            </Box>
          </Box>
          <HStack
            alignItems='center'
            pt='20px'
            w='100%'
            justifyContent='center'
          >
            <Text pr='12px' noOfLines={3}>
              {address}
            </Text>
            <BigButton px='16px' py='4px' onPress={onCopy}>
              <FiCopy />
            </BigButton>
          </HStack>
          <Text fontSize='12px' color='gray.500'>
            {addressCopied ? 'Address copied' : ' '}
          </Text>
        </Modal.Body>
      </Modal.Content>
    </Modal>
  );
};
