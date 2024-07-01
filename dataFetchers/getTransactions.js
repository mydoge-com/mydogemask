import { MESSAGE_TYPES } from '../scripts/helpers/constants';
import { sendMessage } from '../scripts/helpers/message';
import { formatTransaction } from '../utils/transactions';

export const getTransactionsKey = (
  pageIndex,
  previousPageData,
  walletAddress
) => {
  if (previousPageData && !previousPageData.length) return null;
  return [pageIndex + 1, walletAddress, `/transactions/${walletAddress}`];
};

export const getTransactions = ([pageIndex, walletAddress]) =>
  new Promise((resolve, reject) => {
    sendMessage(
      {
        message: MESSAGE_TYPES.GET_TRANSACTIONS,
        data: {
          address: walletAddress,
          page: pageIndex,
        },
      },
      ({ transactions }) => {
        if (transactions) {
          const formattedTransactions = [];
          transactions.forEach((transaction) => {
            formattedTransactions.push(
              formatTransaction({ transaction, walletAddress })
            );
          });

          resolve(formattedTransactions);
        } else {
          reject(new Error('Failed to get recent transactions'));
        }
      }
    );
  });
