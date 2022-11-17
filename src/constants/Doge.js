// Slightly higher than dust amount and equal to inital fee calculation on the server
// Should ensure /tx/prepare never fails
export const FEE_PER_KB_SERVER = 1500000;
export const MIN_TX_AMOUNT = 1000000;
export const MIN_DUST_REMAINING = MIN_TX_AMOUNT + FEE_PER_KB_SERVER;
export const MIN_CONFIRMATIONS = 1;
