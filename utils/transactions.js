export function getTxSummary(tx, address) {
  // console.log('tx', tx);
  const ret = { type: '', amount: 0, fromAddr: '', toAddr: '' };
  // Assumes one to one sender / receiver per tx, TODO multiple
  tx.inputs.forEach((input) => {
    // console.log('input', input);
    input.addresses.forEach((addr) => {
      if (addr === address) {
        ret.type = 'outgoing';
        ret.fromAddr = address;
      } else if (ret.type === '') {
        ret.type = 'incoming';
        ret.fromAddr = addr;
      }
    });
  });
  ret.amount = 0;
  tx.outputs.forEach((output) => {
    // console.log('output', output);
    output.addresses?.forEach((addr) => {
      if (
        (ret.type === 'incoming' && addr === address) ||
        (ret.type === 'outgoing' && addr !== address)
      ) {
        ret.amount += output.value;
        ret.toAddr = ret.type === 'incoming' ? address : addr;
      }
    });
  });

  return ret;
}

export const formatTransaction = ({ transaction, walletAddress }) => {
  let address =
    transaction.vout[0].addresses[0] || transaction.vout[1].addresses[0];
  const amount =
    transaction.vout[0].value !== '0'
      ? transaction.vout[0].value
      : transaction.vout[1].value;
  const type = address === walletAddress ? 'incoming' : 'outgoing';
  if (type === 'incoming') {
    [address] = transaction.vin[0].addresses;
  }
  const { txid: id, blockTime, confirmations } = transaction;
  return { address, amount, type, blockTime, id, confirmations };
};
