import {
  crypto,
  Networks,
  Opcode,
  PrivateKey,
  Script,
  Transaction,
} from 'bitcore-lib-doge';

import { doginals, doginalsV2 } from '../api';
import { NFT_PAGE_SIZE } from './constants';
import { network } from './wallet';

const { Hash, Signature } = crypto;
const MAX_CHUNK_LEN = 240;
const MAX_PAYLOAD_LEN = 1500;

Networks.add({
  name: 'doge',
  alias: 'dogecoin',
  pubkeyhash: network.pubKeyHash,
  privatekey: network.wif,
  scripthash: network.scriptHash,
  xpubkey: network.bip32.public,
  xprivkey: network.bip32.private,
});

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

  const privateKey = new PrivateKey(privkey, 'doge');
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

export async function getDoginals(address, cursor, result) {
  let query;
  await doginalsV2
    .get(
      `/address/inscriptions?address=${address}&cursor=${cursor}&size=${NFT_PAGE_SIZE}`
    )
    .json((res) => {
      query = res;
    });

  // console.log(
  //   'found',
  //   query.result.list.length,
  //   'doginals in page',
  //   cursor,
  //   'total',
  //   query.result.total
  // );

  result.push(
    ...query.result.list.map((i) => ({
      txid: i.output.split(':')[0],
      vout: parseInt(i.output.split(':')[1], 10),
      // Return extra data for rendering and transfering
      outputValue: i.outputValue,
    }))
  );

  // console.log(`fetched ${result.length}/${query.result.total} inscriptions`);

  // Fixes an issue where Doginals API returns `total` less than items in `list` array.
  if (query.result.total > result.length) {
    cursor += query.result.list.length;
    return getDoginals(address, cursor, result);
  }
}

export async function getDRC20Inscriptions(address, ticker, cursor, result) {
  const query = await doginalsV2
    .get(
      `/brc20/transferable-list?address=${address}&ticker=${encodeURIComponent(
        ticker
      )}&cursor=${cursor}&size=${NFT_PAGE_SIZE}`
    )
    .json();

  result.push(
    ...query.result.list.map((i) => {
      const txid = i.inscriptionId.slice(0, -2);
      const vout = parseInt(i.inscriptionId.slice(-1), 10);

      return {
        txid,
        vout,
        // Return extra data for rendering and transfering
        ticker,
        contentType: 'text/plain',
        content: `https://wonky-ord.dogeord.io/content/${i.inscriptionId}`,
        output: `${txid}:${vout}`,
        amount: i.amount,
      };
    })
  );

  if (query.result.total !== result.length) {
    cursor += query.result.list.length;
    return getDRC20Inscriptions(address, ticker, cursor, result);
  }
}

export async function getDRC20Balances(address, cursor, result) {
  let query;
  await doginals
    .get(
      `/brc20/tokens?address=${address}&cursor=${cursor}&size=${NFT_PAGE_SIZE}`
    )
    .json((res) => {
      query = res;
    });

  result.push(...query.result.list);

  // console.log(
  //   'found',
  //   query.result.list.length,
  //   'drc20 balances',
  //   'in page',
  //   cursor,
  //   'total',
  //   total
  // );

  if (query.result.total > result.length) {
    cursor += query.result.list.length;
    return getDRC20Balances(address, cursor, result);
  }
}

export async function getDRC20Tickers(address, cursor, total, result) {
  let query;
  await doginals
    .get(
      `/brc20/tokens?address=${address}&cursor=${cursor}&size=${NFT_PAGE_SIZE}`
    )
    .json((res) => {
      query = res;
    });

  if (cursor === 0) {
    total = query.result.total;
  }

  result.push(
    ...query.result.list
      .map((i) => {
        if (i.transferableBalance !== '0') {
          return i.ticker;
        } else {
          total--;
        }
      })
      .filter((i) => i)
  );

  if (total > result.length) {
    cursor += query.result.list.length;
    return getDRC20Tickers(address, cursor, total, result);
  }
}

export async function getAllDRC20(address, result) {
  const tickers = [];
  await getDRC20Tickers(address, 0, 0, tickers);

  for await (const ticker of tickers) {
    const tickerResult = [];
    await getDRC20Inscriptions(address, ticker, 0, tickerResult);
    result.push(...tickerResult);
  }
}

export async function getAllInscriptions(address) {
  const nfts = [];
  await getDoginals(address, 0, nfts);

  const drc20 = [];
  await getAllDRC20(address, drc20);

  return [...nfts, ...drc20];
}
