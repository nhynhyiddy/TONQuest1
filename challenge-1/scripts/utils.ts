import { Address } from '@ton/core';
import { TonClient } from '@ton/ton';



export const toncenter = new TonClient({
	endpoint: 'https://testnet.toncenter.com/api/v2/jsonRPC',
});

export const nftCollectionAddress = Address.parse('EQDf6HCOggN_ZGL6YsYleN6mDiclQ_NJOMY-x8G5cTRDOBW4');
//https://testnet.explorer.tonnft.tools/collection/EQDf6HCOggN_ZGL6YsYleN6mDiclQ_NJOMY-x8G5cTRDOBW4



export async function getNextItem() {

	let { stack } = await toncenter.runMethod(
		nftCollectionAddress, 
		'get_collection_data'
	);
	let nextItemIndex = stack.readBigNumber();

	return nextItemIndex;
}

