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
import { BigButton } from '../Button';
import { CreateAddressModal } from './CreateAddressModal';
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

  const onCloseModal = useCallback((callback) => {
    setOpenModal(null);
    openMenu.current?.();
    callback?.();
  }, []);

  const onCreateAddress = useCallback(() => {
    setOpenModal('CREATE_ADDRESS');
  }, []);

  const onSelectAddress = useCallback(
    (index) => {
      dispatch({ type: DISPATCH_TYPES.SELECT_WALLET, payload: { index } });
    },
    [dispatch]
  );

  const scrollRef = useRef(null);
  const openMenu = useRef(null);

  const activeAddress = wallet.addresses[selectedAddressIndex];
  const activeAddressNickname =
    wallet.nicknames?.[activeAddress] ?? `Address ${selectedAddressIndex + 1}`;

  return (
    <HStack
      alignItems='center'
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
      >
        {activeAddressNickname}
      </Text>
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
                        {wallet.nicknames?.[address] ?? `Address ${i + 1}`}
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
            Account Details
          </MenuItem>
          <Divider my='6px' w='100%' />
          <MenuItem onPress={onCreateAddress}>
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
        addressNickname={activeAddressNickname}
        wallet={wallet}
        address={activeAddress}
        allowEdit
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
      <CreateAddressModal
        showModal={openModal === 'CREATE_ADDRESS'}
        onClose={onCloseModal}
        wallet={wallet}
        scrollRef={scrollRef}
        openMenu={openMenu}
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
  const [client, setClient] = useState(null);
  const [currentOrigin, setCurrentOrigin] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const getClientsAndTab = useCallback(() => {
    try {
      chrome?.tabs
        ?.query({ active: true, currentWindow: true })
        .then((tabs) => {
          setCurrentOrigin(new URL(tabs[0].url).origin);
          getConnectedClient().then((connectedClients) => {
            setClient(connectedClients[currentOrigin]);
          });
        });
    } catch (e) {
      logError(e);
    }
  }, [currentOrigin]);

  const onDisconnect = useCallback(() => {
    sendMessage(
      {
        message: MESSAGE_TYPES.CLIENT_DISCONNECT,
        data: { origin: currentOrigin },
      },
      () => {
        setClient(null);
        setIsOpen(false);
      }
    );
  }, [currentOrigin]);

  useEffect(() => {
    getClientsAndTab();
  }, [getClientsAndTab]);
  return (
    <>
      <DetailPopup
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        client={client}
        currentOrigin={currentOrigin}
        onDisconnect={onDisconnect}
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

const DetailPopup = ({
  isOpen,
  onClose,
  client,
  currentOrigin,
  onDisconnect,
}) => {
  return (
    <AlertDialog isOpen={isOpen} onClose={onClose} size='lg'>
      <AlertDialog.Content>
        <AlertDialog.CloseButton />
        <AlertDialog.Header>
          {currentOrigin ? new URL(currentOrigin).hostname : ' '}
        </AlertDialog.Header>
        <AlertDialog.Body>
          {client ? (
            <VStack>
              <Text>You have 1 account connected to this site.</Text>
              <Text
                fontSize='sm'
                fontWeight='semibold'
                color='gray.500'
                textAlign='center'
                pb='8px'
                pt='8px'
              >
                {client.address.slice(0, 8)}...
                {client.address.slice(-4)}
              </Text>
              <Text fontSize='10px' color='gray.500'>
                This website can see your address, account balance, activity,
                and suggest transactions to approve
              </Text>
            </VStack>
          ) : (
            <Text>
              MyDogeMask is not connected to this website. To connect, find and
              click the Connect button on the site.
            </Text>
          )}
        </AlertDialog.Body>
        {client ? (
          <AlertDialog.Footer>
            <BigButton variant='danger' onPress={onDisconnect} px='24px'>
              Disconnect
            </BigButton>
          </AlertDialog.Footer>
        ) : null}
      </AlertDialog.Content>
    </AlertDialog>
  );
};

// const getAddressNickname = (wallet, address) => {
//   const addressIndex = wallet.addresses.indexOf(address);
//   if (addressIndex >= 0) {
//     return wallet.nicknames?.[address] ?? `Address ${addressIndex + 1}`;
//   }
//   return '';
// };
