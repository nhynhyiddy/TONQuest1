import { NetworkProvider } from '@ton/blueprint';
import { Contract, TupleItemInt } from '@ton/core';
import { Address } from '@ton/core';
import { TonClient, TonClient4 } from '@ton/ton';


// export const toncenter = new TonClient({
// 	endpoint: 'https://testnet.toncenter.com/api/v2/jsonRPC',
// });

export const nftCollectionAddress = Address.parse('EQDf6HCOggN_ZGL6YsYleN6mDiclQ_NJOMY-x8G5cTRDOBW4');
//https://testnet.explorer.tonnft.tools/collection/EQDf6HCOggN_ZGL6YsYleN6mDiclQ_NJOMY-x8G5cTRDOBW4




export async function getCollectionData(provider: NetworkProvider) {
	console.log("Provider", await provider.ui().prompt("Hello world"))
	const client = provider.api() as TonClient4
	const {last} = await client.getLastBlock();
	
	let { reader: stack } = await client.runMethod(
		last.seqno,
		nftCollectionAddress, 
		'get_collection_data'
	);
	let nextItemIndex = stack.readBigNumber()
	let contentRoot = stack.readCell();
	let owner = stack.readAddress();

	console.log('Collection info, from get_collection_data() method:')	
	console.log('Next item index:', nextItemIndex.toString());
	console.log('Content root cell:', contentRoot);
	console.log('Collection owner adress:', owner);
	// console.log('Gas used:', gas_used);

	return nextItemIndex;
}

// getCollectionData();


export async function run(provider: NetworkProvider) {
    await getCollectionData(provider);
}
