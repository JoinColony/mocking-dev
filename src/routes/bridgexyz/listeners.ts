import ethers from 'ethers';

import data from './data.ts';
import { type Drain } from './types.ts';

const ERC20_ABI = [
  'event Transfer(address indexed from, address indexed to, uint256 amount)',
];

const listeners = {} as { [key: string]: 'Any' };

exports.updateDrainListeners = async function () {
  const provider = new ethers.providers.JsonRpcProvider(
    'https://mainnet.infura.io/v3/YOUR_INFURA_PROJECT_ID',
  );

  for (const customerId of Object.keys(data.customers)) {
    for (const liquidationAddressId of Object.keys(
      data.customers[customerId].liquidation_addresses,
    )) {
      if (!listeners[liquidationAddressId]) {
        const { address } =
          data.customers[customerId].liquidation_addresses[
            liquidationAddressId
          ];
        const erc20Contract = new ethers.Contract(address, ERC20_ABI, provider);

        erc20Contract.on(
          'Transfer',
          async (from: string, to: string, amount: number) => {
            const drain: Drain = {
              amount: amount.toString(),
              state: 'funds_received',
              created_at: new Date().toString(),
              deposit_tx_hash: '0xdeadbeef',
              receipt: {
                destination_currency: 'usd',
                url: 'https://dashboard.bridge.xyz/transaction/00000000/receipt/00000000',
              },
            };
            data.customers[customerId].liquidation_addresses[
              liquidationAddressId
            ].drains.push(drain);
          },
        );

        listeners[liquidationAddressId] = erc20Contract;
      }
    }
  }
};
