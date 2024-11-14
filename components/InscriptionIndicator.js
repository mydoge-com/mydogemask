import { Box, Text } from 'native-base';

import { TRANSACTION_TYPES } from '../scripts/helpers/constants';

const TRANSACTION_LABELS = {
  [TRANSACTION_TYPES.DRC20_AVAILABLE_TX]: {
    shortLabel: 'Token',
    fullLabel: 'Token Inscription',
    color: 'gray.200',
  },
  [TRANSACTION_TYPES.DRC20_SEND_INSCRIPTION_TX]: {
    shortLabel: 'Token',
    fullLabel: 'Token Transfer',
    color: 'gray.200',
  },
  [TRANSACTION_TYPES.DOGINAL_TX]: {
    shortLabel: 'NFT',
    fullLabel: 'NFT Transfer',
    color: 'amber.100',
  },
};

export const InscriptionIndicator = ({
  cachedInscription,
  _text,
  suffix,
  showFullLabel = false,
  ...props
}) => {
  if (!cachedInscription) return null;

  return (
    <Box
      backgroundColor={TRANSACTION_LABELS[cachedInscription.txType].color}
      borderRadius='8px'
      paddingX='6px'
      justifyContent='center'
      {...props}
    >
      <Text fontSize='9px' fontWeight='medium' {..._text}>
        {
          TRANSACTION_LABELS[cachedInscription.txType][
            showFullLabel ? 'fullLabel' : 'shortLabel'
          ]
        }
        {suffix}
      </Text>
    </Box>
  );
};
