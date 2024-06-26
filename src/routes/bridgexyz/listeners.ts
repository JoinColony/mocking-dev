import { ethers, type Event } from 'ethers';

import data from './data.ts';
import { type Drain } from './types.ts';
import { v4 as uuidv4 } from 'uuid';

const USDC_ADDRESS = '0xC83649CC2f5488E95989Ec6d4CEc98A74793E2a7';
const USDC_ABI = [
  'event Transfer(address indexed from, address indexed to, uint256 amount)',
];

const provider = new ethers.providers.JsonRpcProvider('http://localhost:8545');
const erc20Contract = new ethers.Contract(USDC_ADDRESS, USDC_ABI, provider);

const listenerSet = {} as { [key: string]: boolean };

async function updateDrainListeners() {
  console.log('Setting drain listeners...');

  for (const customerId of Object.keys(data.customers)) {
    for (const liquidationAddressId of Object.keys(
      data.customers[customerId].liquidation_addresses,
    )) {
      if (!listenerSet[liquidationAddressId]) {
        const { address } =
          data.customers[customerId].liquidation_addresses[
            liquidationAddressId
          ];
        erc20Contract.on(
          'Transfer',
          async (from: string, to: string, amount: number, event: Event) => {
            // Only care about token transfers to the liquidation address
            if (
              ethers.utils.getAddress(to) !== ethers.utils.getAddress(address)
            ) {
              return;
            }

            const txReceipt = await event.getTransactionReceipt();

            const drain: Drain = {
              id: uuidv4(),
              amount: amount.toString(),
              state: 'funds_received',
              created_at: new Date().toString(),
              deposit_tx_hash: txReceipt.transactionHash,
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

        listenerSet[liquidationAddressId] = true;
      }
    }
  }
}

export { updateDrainListeners };
