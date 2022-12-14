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
