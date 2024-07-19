import { ScaffoldPlugin } from 'blueprint-scaffold';
import { Config } from '@ton/blueprint';

export const config: Config = {
  plugins: [
    new ScaffoldPlugin(),
  ],
//   network: 'testnet'
//   network: {
//     endpoint: 'https://testnet.toncenter.com/api/v2/jsonRPC',
//     type: 'testnet',
//     // version: 'v2',
//     // key: 'YOUR_API_KEY',
// },
};