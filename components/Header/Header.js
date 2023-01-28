import {
  AlertDialog,
  Avatar,
  Badge,
  Box,
  Button,
  Divider,
  HStack,
  Image,
  Menu,
  Pressable,
  Text,
  Toast,
  VStack,
} from 'native-base';
import { useCallback, useEffect, useRef, useState } from 'react';
import { FiCheck, FiLock, FiSettings } from 'react-icons/fi';
import { MdQrCode2 } from 'react-icons/md';

import { DISPATCH_TYPES } from '../../Context';
import { useAppContext } from '../../hooks/useAppContext';
import { MESSAGE_TYPES } from '../../scripts/helpers/constants';
import { getConnectedClient } from '../../scripts/helpers/data';
import { sendMessage } from '../../scripts/helpers/message';
import { logError } from '../../utils/error';
import { BackButton } from '../BackButton';
import { ToastRender } from '../ToastRender';
import { DeleteAddressModal } from './DeleteAddressModal';
import { SecurityModal } from './SecurityModal';
import { WalletDetailModal } from './WalletDetailModal';

export const Header = ({
  withCancelButton,
  cancelRoute,
  addressColor,
  withConnectStatus,
}) => {
  const { wallet, selectedAddressIndex, dispatch, navigate } = useAppContext();
  const onSignOut = useCallback(() => {
    sendMessage(
      { message: MESSAGE_TYPES.SIGN_OUT },
      () => {
        dispatch({ type: DISPATCH_TYPES.SIGN_OUT });
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
          dispatch({
            type: DISPATCH_TYPES.SET_WALLET,
            payload: { wallet: updatedWallet },
          });
          dispatch({
            type: DISPATCH_TYPES.SELECT_WALLET,
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
      dispatch({ type: DISPATCH_TYPES.SELECT_WALLET, payload: { index } });
    },
    [dispatch]
  );

  const scrollRef = useRef(null);
  const openMenu = useRef(null);

  return (
    <HStack
      alignItems='center'
      // bg='rgba(255,255,255, 0.1)'
      position='absolute'
      zIndex={1}
      w='100%'
      py='8px'
      px='12px'
      justifyContent='flex-end'
    >
      {withConnectStatus ? <ConnectionStatus /> : null}
      {withCancelButton ? (
        <BackButton
          position='absolute'
          left='12px'
          pt='8px'
          onPress={() => navigate(cancelRoute)}
        />
      ) : null}
      <Text
        fontWeight='medium'
        fontSize='lg'
        pb='12px'
        px='12px'
        color={addressColor || 'white'}
        mt='10px'
      >{`Address ${selectedAddressIndex + 1}`}</Text>
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

const ConnectionStatus = () => {
  const [connectedClients, setConnectedClients] = useState({});
  const [currentOrigin, setCurrentOrigin] = useState('');

  const getClientsAndTab = useCallback(() => {
    try {
      getConnectedClient().then((clients) => {
        setConnectedClients(clients);
      });
      chrome?.tabs
        ?.query({ active: true, currentWindow: true })
        .then((tabs) => {
          setCurrentOrigin(new URL(tabs[0].url).origin);
        });
    } catch (e) {
      logError(e);
    }
  }, []);

  const client = connectedClients[currentOrigin];

  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    getClientsAndTab();
  }, [getClientsAndTab]);
  return (
    <>
      <DetailPopup
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        client={client}
      />
      <Button
        position='absolute'
        left='12px'
        alignSelf='center'
        variant='unstyled'
        _hover={{ opacity: 0.7 }}
        _pressed={{ opacity: 0.5 }}
        onPress={() => setIsOpen(true)}
      >
        <Badge
          flexDirection='row'
          px='4px'
          bg={!client ? 'gray.400' : 'gray.200'}
        >
          <Text fontSize='xs'>
            {client ? (
              <>
                <Box bg='green.600' w='8px' h='8px' rounded='full' mr='6px' />
                Connected
              </>
            ) : (
              <>
                <Box
                  borderWidth='1px'
                  w='8px'
                  h='8px'
                  rounded='full'
                  mr='6px'
                />
                Not connected
              </>
            )}
          </Text>
        </Badge>
      </Button>
    </>
  );
};

const DetailPopup = ({ isOpen, onClose, client }) => {
  return (
    <AlertDialog isOpen={isOpen} onClose={onClose}>
      <AlertDialog.Content>
        <AlertDialog.CloseButton />
        <AlertDialog.Header>
          {client ? new URL(client?.origin).hostname : null}
        </AlertDialog.Header>
        <AlertDialog.Body>
          {client ? (
            <>
              <Text>You have 1 account connected to this site.</Text>
              <HStack
                alignItems='center'
                space='12px'
                pb='28px'
                pt='20px'
                justifyContent='center'
              >
                <Avatar
                  size='sm'
                  bg='brandYellow.500'
                  _text={{ color: 'gray.800' }}
                >
                  {client.address.substring(0, 2)}
                </Avatar>
                <Text
                  fontSize='md'
                  fontWeight='semibold'
                  color='gray.500'
                  textAlign='center'
                >
                  {client.address.slice(0, 8)}...
                  {client.address.slice(-4)}
                </Text>
              </HStack>
              <Text fontSize='12px' color='gray.500'>
                This website can see your address, account balance, activity,
                and suggest transactions to approve
              </Text>
            </>
          ) : (
            <Text>
              MyDogeMask is not connected to this website. To connect, find and
              click the Connect button on the site.
            </Text>
          )}
        </AlertDialog.Body>
      </AlertDialog.Content>
    </AlertDialog>
  );
};
