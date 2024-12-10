import {
  crypto,
  Opcode,
  PrivateKey,
  Script,
  Transaction,
} from 'bitcore-lib-doge';
import sb from 'satoshi-bitcoin';

import { mydoge } from '../api';

const { Hash, Signature } = crypto;
const MAX_CHUNK_LEN = 240;
const MAX_PAYLOAD_LEN = 1500;

function bufferToChunk(b, type) {
  b = Buffer.from(b, type);
  return {
    buf: b.length ? b : undefined,
    len: b.length,
    opcodenum: b.length <= 75 ? b.length : b.length <= 255 ? 76 : 77,
  };
}

function numberToChunk(n) {
  return {
    buf:
      n <= 16
        ? undefined
        : n < 128
        ? Buffer.from([n])
        : Buffer.from([n % 256, n / 256]),
    len: n <= 16 ? 0 : n < 128 ? 1 : 2,
    opcodenum: n === 0 ? 0 : n <= 16 ? 80 + n : n < 128 ? 1 : 2,
  };
}

function opcodeToChunk(op) {
  return { opcodenum: op };
}

function fund(utxos, address, privkey, tx) {
  tx.change(address);
  delete tx._fee;

  // console.log('looking over', utxos.length, 'utxos');

  for (const utxo of utxos) {
    if (
      tx.inputs.length &&
      tx.outputs.length &&
      tx.inputAmount >= tx.outputAmount + tx.getFee()
    ) {
      break;
    }

    delete tx._fee;
    tx.from(utxo);
    tx.change(address);

    // console.log('signing tx');
    tx.sign(privkey);

    console.log('funded inscription tx with utxo', utxo.txid, utxo.vout);
  }

  if (tx.inputAmount < tx.outputAmount + tx.getFee()) {
    throw new Error(
      `not enough funds: ${tx.inputAmount} < ${tx.outputAmount + tx.getFee()}`
    );
  }
}

function updateWallet(utxos, address, tx) {
  const updated = utxos.filter((utxo) => {
    for (const input of tx.inputs) {
      if (
        input.prevTxId.toString('hex') === utxo.txid &&
        input.outputIndex === utxo.vout
      ) {
        return false;
      }
    }
    return true;
  });

  tx.outputs.forEach((output, vout) => {
    if (output.script.toAddress().toString() === address) {
      updated.push({
        txid: tx.hash,
        vout,
        script: output.script.toHex(),
        satoshis: output.satoshis,
      });
      console.log('added inscription utxo', tx.hash, vout);
    }
  });

  return updated;
}

export function inscribe(
  utxos,
  address,
  privkey,
  feePerKB,
  contentType,
  contentData
) {
  Transaction.FEE_PER_KB = feePerKB;
  let data = Buffer.from(contentData, 'hex');

  // console.log('set fee per kb', Transaction.FEE_PER_KB);

  const privateKey = new PrivateKey(privkey, 'livenet');
  const publicKey = privateKey.toPublicKey();
  const txs = [];
  const parts = [];
  const inscription = new Script();

  // console.log('setup keys');

  while (data.length) {
    const part = data.slice(0, Math.min(MAX_CHUNK_LEN, data.length));
    data = data.slice(part.length);
    parts.push(part);
  }

  inscription.chunks.push(bufferToChunk('ord'));
  inscription.chunks.push(numberToChunk(parts.length));
  inscription.chunks.push(bufferToChunk(contentType));

  parts.forEach((part, n) => {
    inscription.chunks.push(numberToChunk(parts.length - n - 1));
    inscription.chunks.push(bufferToChunk(part));
  });

  // console.log('setup inscription parts');

  let p2shInput;
  let lastLock;
  let lastPartial;

  while (inscription.chunks.length) {
    const partial = new Script();

    if (txs.length === 0) {
      partial.chunks.push(inscription.chunks.shift());
    }

    while (
      partial.toBuffer().length <= MAX_PAYLOAD_LEN &&
      inscription.chunks.length
    ) {
      partial.chunks.push(inscription.chunks.shift());
      partial.chunks.push(inscription.chunks.shift());
    }

    if (partial.toBuffer().length > MAX_PAYLOAD_LEN) {
      inscription.chunks.unshift(partial.chunks.pop());
      inscription.chunks.unshift(partial.chunks.pop());
    }

    const lock = new Script();
    lock.chunks.push(bufferToChunk(publicKey.toBuffer()));
    lock.chunks.push(opcodeToChunk(Opcode.OP_CHECKSIGVERIFY));
    partial.chunks.forEach(() => {
      lock.chunks.push(opcodeToChunk(Opcode.OP_DROP));
    });
    lock.chunks.push(opcodeToChunk(Opcode.OP_TRUE));

    const lockhash = Hash.ripemd160(Hash.sha256(lock.toBuffer()));

    const p2sh = new Script();
    p2sh.chunks.push(opcodeToChunk(Opcode.OP_HASH160));
    p2sh.chunks.push(bufferToChunk(lockhash));
    p2sh.chunks.push(opcodeToChunk(Opcode.OP_EQUAL));

    const p2shOutput = new Transaction.Output({
      script: p2sh,
      satoshis: 100000,
    });

    // console.log('created p2sh output');

    const tx = new Transaction();

    if (p2shInput) {
      // console.log('found p2sh input');
      tx.addInput(p2shInput);
      // console.log('added p2sh input');
    }

    tx.addOutput(p2shOutput);

    // console.log('added p2sh output');

    fund(utxos, address, privkey, tx);

    if (p2shInput) {
      const signature = Transaction.sighash.sign(
        tx,
        privateKey,
        Signature.SIGHASH_ALL,
        0,
        lastLock
      );
      const txsignature = Buffer.concat([
        signature.toBuffer(),
        Buffer.from([Signature.SIGHASH_ALL]),
      ]);

      const unlock = new Script();
      unlock.chunks = unlock.chunks.concat(lastPartial.chunks);
      unlock.chunks.push(bufferToChunk(txsignature));
      unlock.chunks.push(bufferToChunk(lastLock.toBuffer()));
      tx.inputs[0].setScript(unlock);
    }

    utxos = updateWallet(utxos, address, tx);

    txs.push(tx);

    p2shInput = new Transaction.Input({
      prevTxId: tx.hash,
      outputIndex: 0,
      output: tx.outputs[0],
      script: '',
    });

    p2shInput.clearSignatures = () => {};
    p2shInput.getSignatures = () => [];

    lastLock = lock;
    lastPartial = partial;
  }

  const tx = new Transaction();
  tx.addInput(p2shInput);
  tx.to(address, 100000);

  fund(utxos, address, privkey, tx);

  const signature = Transaction.sighash.sign(
    tx,
    privateKey,
    Signature.SIGHASH_ALL,
    0,
    lastLock
  );
  const txsignature = Buffer.concat([
    signature.toBuffer(),
    Buffer.from([Signature.SIGHASH_ALL]),
  ]);

  const unlock = new Script();
  unlock.chunks = unlock.chunks.concat(lastPartial.chunks);
  unlock.chunks.push(bufferToChunk(txsignature));
  unlock.chunks.push(bufferToChunk(lastLock.toBuffer()));
  tx.inputs[0].setScript(unlock);

  txs.push(tx);

  return txs;
}

export async function getDRC20Inscriptions(address, ticker) {
  const query = (
    await mydoge.get(
      `/inscriptions/${address}?filter=drc20&ticker=${encodeURIComponent(
        ticker
      )}`
    )
  ).data;

  return query.list;
}

export async function getDRC20Balances(address, ticker) {
  const result = (
    await mydoge.get(`/drc20/${address}${ticker ? `?ticker=${ticker}` : ''}`)
  ).data;

  return result.balances;
}

export async function getDunesBalances(address, ticker) {
  const result = (
    await mydoge.get(`/dunes/${address}${ticker ? `?ticker=${ticker}` : ''}`)
  ).data;

  return result.balances;
}

async function getUtxos(address, cursor, result, filter, tx = null) {
  const query = (
    await mydoge.get(
      `/utxos/${address}?filter=${filter}${cursor ? `&cursor=${cursor}` : ''}`
    )
  ).data;

  let { utxos } = query;

  // console.log('found', query.utxos.length, filter, 'utxos in page', cursor);

  if (tx) {
    utxos = utxos.filter(
      (utxo) => utxo.txid === tx.txid && utxo.vout === tx.vout
    );
  }

  result.push(
    ...utxos.map((i) => ({
      txid: i.txid,
      vout: i.vout,
      outputValue: i.satoshis,
      script: i.script_pubkey,
      ...(filter === 'inscriptions' && { inscriptions: i.inscriptions }),
    }))
  );

  if (result.length && tx) {
    return;
  }

  result = result.sort(
    (a, b) => sb.toBitcoin(b.outputValue) - sb.toBitcoin(a.outputValue)
  );

  if (query.next_cursor) {
    return getUtxos(address, query.next_cursor, result, filter);
  }
}

export async function getInscriptionsUtxos(address) {
  const inscriptions = [];
  await getUtxos(address, 0, inscriptions, 'inscriptions');

  return inscriptions;
}

export async function getSpendableUtxos(address) {
  const utxos = [];
  await getUtxos(address, 0, utxos, 'spendable');

  return utxos;
}

export async function getInscriptionsUtxo(address, tx) {
  const inscriptions = [];
  await getUtxos(address, 0, inscriptions, 'inscriptions', tx);

  return inscriptions[0];
}
