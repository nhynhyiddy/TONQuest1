import { Blockchain, RemoteBlockchainStorage, SandboxContract, TreasuryContract, wrapTonClient4ForRemote } from "@ton/sandbox";
import AddressSaver from "../wrappers/AddressSaver"
import { Address, Cell, TransactionComputeVm, TransactionDescriptionGeneric, beginCell, toNano } from "@ton/core";
import "@ton/test-utils"; // register matchers
import * as fs from "fs";
import { randomAddress } from "@ton/test-utils";


let contract: SandboxContract<AddressSaver>;
let deployer: SandboxContract<TreasuryContract>;
let blockchain: Blockchain;

describe("AddressSaver tests", () => {

    
    
    beforeEach(async () => {
        blockchain = await Blockchain.create();

        deployer = await blockchain.treasury('deployer');
        const code = Cell.fromBoc(fs.readFileSync("build/addressSaver.cell"))[0]; // compilation output from step 6
        contract = blockchain.openContract(
            AddressSaver.createFromConfig(
                {
                    manager: deployer.address,
                },
                code
            )
        );

        const deployResult = await contract.sendDeploy(
            deployer.getSender(),
            toNano('0.01')
        );

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: contract.address,
            deploy: true,
        });
    });

    it('should throw if op = 3', async () => {
        const result = await deployer.send({
            to: contract.address,
            value: toNano('1'),
            body: beginCell().storeUint(3, 32).storeUint(12345n, 64).endCell()
        });
        // console.log(result.transactions.length)
        // console.log(result.transactions.map(tx => console.log("tx", ((tx.description as TransactionDescriptionGeneric)['computePhase'] as TransactionComputeVm)['success'], "/n")))
        expect(result.transactions).toHaveTransaction({
            from: deployer.address,
            to: contract.address,
            success: false,
            exitCode: 3
        });
    });

    it('should change saved address by manager', async () => {
        const address = randomAddress();
        
        const result = await contract.sendChangeAddress(
            deployer.getSender(),
            toNano('0.01'),
            12345n,
            address
        );
    
        expect(result.transactions).toHaveTransaction({
            from: deployer.address,
            to: contract.address,
            success: true
        });

        const [, saved ] = await contract.getCurrentSavedAddress();
        expect(saved.equals(address)).toBeTruthy();
        
    });

    it('should not change saved address by random', async () => {
        const address = randomAddress();
        let user = await blockchain.treasury('user');
        
        const result = await contract.sendChangeAddress(
            user.getSender(),
            toNano('0.01'),
            12345n,
            address
        );
    
        expect(result.transactions).toHaveTransaction({
            from: user.address,
            to: contract.address,
            success: false,
            exitCode: 1001
        });
    });
    
    it('should return required data on `requestAddress` call', async () => {
        const address = randomAddress();
        await contract.sendChangeAddress(deployer.getSender(), toNano(0.1), 2345n, address);
        let user = await blockchain.treasury('user');

        const result = await contract.sendRequestAddress(
            user.getSender(),
            toNano('0.01'),
            12345n
        );
        const msgCell = beginCell()
        .storeUint(3, 32)
        .storeUint(12345n, 64)
        .storeAddress(deployer.address)
        .storeAddress(address)
        .endCell();
        console.log(await contract.getCurrentSavedAddress())
        expect(result.transactions).toHaveTransaction({
            from: contract.address,
            to: user.address,
            success: true,
            body: beginCell()
                .storeRef(msgCell)
                .endCell(),
        });
    
    })
    
})
