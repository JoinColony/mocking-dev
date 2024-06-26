import { ethers, type Event } from 'ethers';

import data from './data.ts';
import { type Drain } from './types.ts';

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
    console.log('For customer', customerId)
    console.log('Customer:', data.customers[customerId])
    console.log('Liquidation addresses:', data.customers[customerId].liquidation_addresses)
    for (const liquidationAddressId of Object.keys(
      data.customers[customerId].liquidation_addresses,
    )) {
      console.log('For liquidation address', liquidationAddressId)
      if (!listenerSet[liquidationAddressId]) {
        const { address } =
          data.customers[customerId].liquidation_addresses[
            liquidationAddressId
          ];
        console.log("has contract address", address);
        erc20Contract.on(
          'Transfer',
          async (from: string, to: string, amount: number, event: Event) => {
            // Only care about token transfers to the liquidation address
            console.log("to", to, address);
            if (to !== address) {
              return;
            }

            const txReceipt = await event.getTransactionReceipt();

            const drain: Drain = {
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
