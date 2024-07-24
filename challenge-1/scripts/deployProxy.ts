import * as fs from "fs";
import { getHttpEndpoint } from "@orbs-network/ton-access";
import { mnemonicToWalletKey } from "ton-crypto";
import { TonClient, Cell, WalletContractV4, toNano, TonClient4 } from "@ton/ton";
import Proxy from "../wrappers/Proxy"; 
import { NetworkProvider } from "@ton/blueprint";


export async function run(provider: NetworkProvider) {
  // initialize ton rpc client on testnet
  const endpoint = await getHttpEndpoint({ network: "testnet" });
  const client = new TonClient({endpoint})

  
// open wallet v4 (notice the correct wallet version here)
const mnemonic = "program verify topic exile blast wedding exist joke bike notable talk kangaroo young pupil onion food jaguar purchase circle regret above ginger garbage notable";
const key = await mnemonicToWalletKey(mnemonic.split(" "));
const wallet = WalletContractV4.create({ publicKey: key.publicKey, workchain: 0 });

if (!await client.isContractDeployed(wallet.address)) {
    return console.log("wallet is not deployed");
}
const walletContract = client.open(wallet);
const walletSender = walletContract.sender(key.secretKey);
const addr = walletContract.address;
// console.log("isAddress external", ExternalAddress.isAddress(addr))
// console.log("isAddress", Address.isAddress(addr))
  // prepare and data cells for deployment
  const code = Cell.fromBoc(fs.readFileSync("build/proxy.cell"))[0]; // compilation output from step 6
  const proxy = Proxy.createFromConfig({owner: walletContract.address}, code);

  // exit if contract is already deployed
  console.log("contract address:", proxy.address.toString());
  if (await client.isContractDeployed(proxy.address)) {
    return console.log("Counter already deployed");
  }

  // open wallet and read the current seqno of the wallet
//   const walletContract = client.open(wallet);
//   const walletSender = walletContract.sender(key.secretKey);
  const seqno = await walletContract.getSeqno();

  // send the deploy transaction
  const proxyContract = client.open(proxy);
  await proxyContract.sendDeploy(walletSender, toNano(1.0));

  // wait until confirmed
  let currentSeqno = seqno;
  while (currentSeqno == seqno) {
    console.log("waiting for deploy transaction to confirm...");
    await sleep(1500);
    currentSeqno = await walletContract.getSeqno();
  }
  console.log("deploy transaction confirmed!");
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
