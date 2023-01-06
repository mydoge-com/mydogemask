import { Box, HStack, Image, Modal, Text } from 'native-base';
import { FiCopy } from 'react-icons/fi';

import { useCopyText } from '../../hooks/useCopyText';
import { BigButton } from '../Button';
import { QRCode } from './QRCode';

export const WalletDetailModal = ({
  showModal,
  onClose,
  walletName,
  address,
}) => {
  const { copyTextToClipboard, textCopied } = useCopyText({ text: address });
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
            <BigButton px='16px' py='4px' onPress={copyTextToClipboard}>
              <FiCopy />
            </BigButton>
          </HStack>
          <Text fontSize='12px' color='gray.500'>
            {textCopied ? 'Address copied' : ' '}
          </Text>
        </Modal.Body>
      </Modal.Content>
    </Modal>
  );
};
