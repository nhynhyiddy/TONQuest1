import { Address, openContract, toNano } from '@ton/core';
import { JettonMinter, JettonMinterContent, jettonContentToCell, jettonMinterConfigToCell } from '../wrappers/JettonMinter';
import { compile, NetworkProvider, UIProvider} from '@ton/blueprint';
import { promptAddress, promptBool, promptUrl, waitForTransaction } from '../wrappers/ui-utils';
import { TonClient4 } from '@ton/ton';

const formatUrl = "https://github.com/ton-blockchain/TEPs/blob/master/text/0064-token-data-standard.md#jetton-metadata-example-offchain";

const urlPrompt = 'Please specify url pointing to jetton metadata(json):';

export async function run(provider: NetworkProvider) {
    const ui       = provider.ui();
    const sender   = provider.sender();
    
    const adminPrompt = `Please specify admin address`;
    ui.write(`Jetton deployer\nCurrent deployer onli supports off-chain format:${formatUrl}`);

    let admin      = await promptAddress(adminPrompt, ui, sender.address);
    ui.write(`Admin address:${admin}\n`);
    let contentUrl = await promptUrl(urlPrompt, ui);
    ui.write(`Jetton content url:${contentUrl}`);

    let dataCorrect = false;
    do {
        ui.write("Please verify data:\n")
        ui.write(`Admin:${admin}\n\n`);
        ui.write('Metadata url:' + contentUrl);
        dataCorrect = await promptBool('Is everything ok?', ['y','n'], ui);
        if(!dataCorrect) {
            const upd = await ui.choose('What do you want to update?', ['Admin', 'Url'], (c) => c);

            if(upd == 'Admin') {
                admin = await promptAddress(adminPrompt, ui, sender.address);
            }
            else {
                contentUrl = await promptUrl(urlPrompt, ui);
            }
        }

    } while(!dataCorrect);

    const content = jettonContentToCell({type:1,uri:contentUrl});

    const wallet_code = await compile('JettonWallet');
    const minter = provider.open(JettonMinter.createFromConfig(
        {
            admin,
            content,
            wallet_code,
        }, 
        await compile('JettonMinter'))

    )
    if (await provider.isContractDeployed(minter.address)) {
        return console.log("Minter already deployed");
    }
    await minter.sendDeploy(sender, toNano(0.95))
    await provider.waitForDeploy(minter.address, 100, 5000);
    
}