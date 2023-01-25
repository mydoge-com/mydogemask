import { AlertDialog, Button, Text, Toast } from 'native-base';
import { useCallback, useRef } from 'react';

import { DISPATCH_TYPES } from '../../Context';
import { useAppContext } from '../../hooks/useAppContext';
import { MESSAGE_TYPES } from '../../scripts/helpers/constants';
import { sendMessage } from '../../scripts/helpers/message';
import { BigButton } from '../Button';
import { ToastRender } from '../ToastRender';

export const DeleteAddressModal = ({
  showModal,
  onClose,
  selectedAddressIndex,
}) => {
  const cancelRef = useRef();
  const { dispatch, wallet } = useAppContext();
  const onDeleteAddress = useCallback(() => {
    sendMessage(
      {
        message: MESSAGE_TYPES.DELETE_ADDRESS,
        data: { index: selectedAddressIndex },
      },
      ({ wallet: updatedWallet }) => {
        if (updatedWallet) {
          dispatch({
            type: DISPATCH_TYPES.SET_WALLET,
            payload: { wallet: updatedWallet },
          });
          dispatch({
            type: DISPATCH_TYPES.SELECT_WALLET,
            payload: { index: Math.max(selectedAddressIndex - 1, 0) },
          });
          onClose?.();
          Toast.show({
            duration: 3000,
            render: () => {
              return (
                <ToastRender description='Address deleted' status='info' />
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
  }, [selectedAddressIndex, dispatch, onClose]);
  return (
    <AlertDialog
      leastDestructiveRef={cancelRef}
      isOpen={showModal}
      onClose={onClose}
    >
      <AlertDialog.Content>
        <AlertDialog.CloseButton />
        <AlertDialog.Header>Delete address</AlertDialog.Header>
        <AlertDialog.Body>
          <Text fontWeight='bold' color='danger.500' pb='4px'>
            {wallet.addresses[selectedAddressIndex]}
          </Text>
          Are you sure you want to delete this address? Deleting an address will
          simply remove it from your wallet. The balance will remain and it can
          be added back using "Create address".
        </AlertDialog.Body>
        <AlertDialog.Footer>
          <Button.Group space={2}>
            <Button
              variant='unstyled'
              colorScheme='coolGray'
              onPress={onClose}
              ref={cancelRef}
            >
              Cancel
            </Button>
            <BigButton variant='danger' onPress={onDeleteAddress} px='24px'>
              Delete
            </BigButton>
          </Button.Group>
        </AlertDialog.Footer>
      </AlertDialog.Content>
    </AlertDialog>
  );
};
