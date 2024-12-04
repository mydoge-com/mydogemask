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

export const formatTransaction = ({ transaction: tx, walletAddress }) => {
  let type = 'incoming';
  let amountIn = 0;
  let amountOut = 0;
  let totalIn = 0;
  let totalOut = 0;
  let incomingAddress = '';
  let outgoingAddress = '';

  tx.vin.forEach((input) => {
    const [address] = input.addresses;
    const value = Number(input.value);

    if (!incomingAddress && address !== walletAddress) {
      incomingAddress = address;
    }

    if (input.addresses.includes(walletAddress)) {
      amountOut += value;
    }

    totalIn += value;
  });

  tx.vout.forEach((output) => {
    const [address] = output.addresses;
    const value = Number(output.value);

    if (!outgoingAddress && outgoingAddress !== walletAddress) {
      outgoingAddress = address;
    }

    if (output.addresses.includes(walletAddress)) {
      amountIn += Number(output.value);
    }

    totalOut += value;
  });

  if (amountOut > amountIn) {
    type = 'outgoing';
  }

  const fee = totalIn - totalOut;
  let amount =
    type === 'incoming' ? amountIn - amountOut : amountOut - amountIn - fee;
  let address = type === 'incoming' ? incomingAddress : outgoingAddress;
  const { txid: id, blockTime, confirmations } = tx;

  if (type === 'outgoing' && amount < 0) {
    address = incomingAddress;
    type = 'incoming';
    amount = -amount;
  }

  return { address, amount, type, blockTime, id, confirmations, fee };
};
