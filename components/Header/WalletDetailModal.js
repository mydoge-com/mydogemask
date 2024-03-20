import {
  Box,
  Button,
  HStack,
  Image,
  Input,
  Modal,
  Text,
  VStack,
} from 'native-base';
import { useCallback, useState } from 'react';
import { FiCheck, FiCopy, FiEdit3 } from 'react-icons/fi';

import { useAppContext } from '../../hooks/useAppContext';
import { useCopyText } from '../../hooks/useCopyText';
import {
  MAX_NICKNAME_LENGTH,
  MESSAGE_TYPES,
} from '../../scripts/helpers/constants';
import { sendMessage } from '../../scripts/helpers/message';
import { BigButton } from '../Button';
import { QRCode } from './QRCode';

export const WalletDetailModal = ({
  showModal,
  onClose,
  addressNickname,
  address,
  wallet,
  allowEdit,
}) => {
  const { copyTextToClipboard, textCopied } = useCopyText({ text: address });
  const [editingNickname, setEditingNickname] = useState(false);

  return (
    <Modal
      isOpen={showModal}
      onClose={() => {
        onClose();
        setEditingNickname(false);
      }}
    >
      <Modal.Content maxWidth='500px' width='90%' h='auto' maxH='750px'>
        <Modal.CloseButton />
        <Modal.Body alignItems='center'>
          <HStack alignItems='center'>
            {!editingNickname ? (
              <>
                <Text
                  textAlign='center'
                  fontWeight='medium'
                  fontSize='xl'
                  maxW='180px'
                  noOfLines={1}
                >
                  {addressNickname}
                </Text>
                {allowEdit ? (
                  <Button
                    variant='unstyled'
                    ml='auto'
                    onPress={() => setEditingNickname(true)}
                  >
                    <FiEdit3 size={18} color='gray' />
                  </Button>
                ) : null}
              </>
            ) : (
              <NicknameUpdate
                addressNickname={addressNickname}
                address={address}
                wallet={wallet}
                setEditingNickname={setEditingNickname}
              />
            )}
          </HStack>
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
                avatarSource={{ uri: '/assets/dogecoin-logo-300.png' }}
              />
              <Image
                source={{ uri: '/assets/mydoge-logo.svg' }}
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
          <VStack alignItems='center' pt='20px' justifyContent='center'>
            <Text fontSize='12px'>{address}</Text>
            <BigButton
              px='16px'
              py='4px'
              mt='15px'
              onPress={copyTextToClipboard}
            >
              <FiCopy />
            </BigButton>
          </VStack>
          <Text fontSize='12px' color='gray.500'>
            {textCopied ? 'Address copied' : ' '}
          </Text>
        </Modal.Body>
      </Modal.Content>
    </Modal>
  );
};

const NicknameUpdate = ({
  addressNickname,
  address,
  wallet,
  setEditingNickname,
}) => {
  const [error, setError] = useState('');
  const [nicknameInput, setNicknameInput] = useState(addressNickname);
  const { dispatch } = useAppContext();

  const onSubmit = useCallback(() => {
    if (!nicknameInput) {
      setError('Enter an address name');
      return;
    }
    if (
      Object.values(wallet.nicknames ?? {}).includes(nicknameInput) &&
      nicknameInput !== addressNickname
    ) {
      setError('Address name already exists');
      return;
    }
    sendMessage(
      {
        message: MESSAGE_TYPES.UPDATE_ADDRESS_NICKNAME,
        data: {
          address,
          nickname: nicknameInput,
        },
      },
      (updatedWallet) => {
        if (updatedWallet) {
          dispatch({ type: 'SET_WALLET', payload: updatedWallet });
          setError('');
          setEditingNickname(false);
        } else {
          setError('Error updating address name');
        }
      }
    );
  }, [
    address,
    addressNickname,
    dispatch,
    nicknameInput,
    setEditingNickname,
    wallet?.nicknames,
  ]);

  const onChangeText = useCallback((text) => {
    setError('');
    setNicknameInput(text);
  }, []);
  return (
    <VStack>
      <Input
        placeholder='Enter address name'
        variant='outline'
        w='200px'
        focusOutlineColor='brandYellow.500'
        _hover={{
          borderColor: 'brandYellow.500',
        }}
        _focus={{
          borderColor: 'brandYellow.500',
        }}
        onChangeText={onChangeText}
        _invalid={{
          borderColor: 'red.500',
          focusOutlineColor: 'red.500',
          _hover: {
            borderColor: 'red.500',
          },
        }}
        isInvalid={error}
        value={nicknameInput}
        maxLength={MAX_NICKNAME_LENGTH}
        autoFocus
      />
      <Text fontSize='10px' color='red.500' pt='2px' textAlign='center'>
        {error}
      </Text>
      <Button
        variant='unstyled'
        onPress={onSubmit}
        position='absolute'
        top={0}
        right={0}
      >
        <FiCheck size={18} color='gray' />
      </Button>
    </VStack>
  );
};
