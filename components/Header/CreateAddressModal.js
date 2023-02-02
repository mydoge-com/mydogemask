import { Input, Modal, Text, Toast, VStack } from 'native-base';
import { useCallback, useState } from 'react';

import { DISPATCH_TYPES } from '../../Context';
import { useAppContext } from '../../hooks/useAppContext';
import { MESSAGE_TYPES } from '../../scripts/helpers/constants';
import { sendMessage } from '../../scripts/helpers/message';
import { BigButton } from '../Button';
import { ToastRender } from '../ToastRender';

export const CreateAddressModal = ({
  showModal,
  onClose,
  wallet,
  openMenu,
  scrollRef,
}) => {
  const [error, setError] = useState('');
  const [nicknameInput, setNicknameInput] = useState('');
  const { dispatch } = useAppContext();

  const onChangeText = useCallback((text) => {
    setError('');
    setNicknameInput(text);
  }, []);

  const onSubmit = useCallback(() => {
    if (Object.values(wallet.nicknames ?? {}).includes(nicknameInput)) {
      setError('Account name already exists');
      return;
    }
    sendMessage(
      {
        message: MESSAGE_TYPES.GENERATE_ADDRESS,
        data: { nickname: nicknameInput },
      },
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
          setNicknameInput('');
          setError('');
          onClose(() => {
            setTimeout(() => {
              scrollRef?.current?.scrollIntoView({
                behavior: 'smooth',
                block: 'end',
              });
            });
          });
          openMenu.current?.();
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
  }, [
    dispatch,
    nicknameInput,
    onClose,
    openMenu,
    scrollRef,
    wallet?.nicknames,
  ]);

  return (
    <Modal isOpen={showModal} onClose={onClose}>
      <Modal.Content maxWidth='500px' width='90%' h='auto' maxH='750px'>
        <Modal.CloseButton />
        <Modal.Header>Create Address</Modal.Header>
        <Modal.Body alignItems='center'>
          <VStack w='100%'>
            <Input
              placeholder='Enter address nickname'
              variant='filled'
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
              mt='12px'
              size='lg'
              autoFocus
            />
            <Text fontSize='10px' color='red.500' pt='2px' textAlign='center'>
              {error || ' '}
            </Text>
            <BigButton my='6px' onPress={onSubmit}>
              Create Address
            </BigButton>
          </VStack>
        </Modal.Body>
      </Modal.Content>
    </Modal>
  );
};
