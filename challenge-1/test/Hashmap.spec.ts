import { Blockchain, RemoteBlockchainStorage, SandboxContract, TreasuryContract, wrapTonClient4ForRemote } from "@ton/sandbox";
import Hashmap from "../wrappers/Hashmap"
import { Address, Cell, TransactionComputeVm, TransactionDescriptionGeneric, beginCell, toNano } from "@ton/core";
import "@ton/test-utils"; // register matchers
import * as fs from "fs";
import { randomAddress } from "@ton/test-utils";
import { compile } from '@ton/blueprint';


let contract: SandboxContract<Hashmap>;
let deployer: SandboxContract<TreasuryContract>;
let blockchain: Blockchain;
let code: Cell
describe("Hashmap tests", () => {

    beforeAll(async () => {
        code = await compile('Hashmap');
    });
    
    beforeEach(async () => {
        blockchain = await Blockchain.create();
    
        blockchain.now = 500;
    
        deployer = await blockchain.treasury('deployer');
    
        contract = blockchain.openContract(
            Hashmap.createFromConfig(
                {},
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
    
        let tx = await contract.sendSet(deployer.getSender(), toNano('0.05'), {
            queryId: 123n,
            key: 1n,
            validUntil: 1000n,
            value: beginCell().storeUint(123, 16).endCell().asSlice(),
        });

        expect(tx.transactions).toHaveTransaction({
            from: deployer.address,
            to: contract.address,
            op: 1
        });
    
    
        await contract.sendSet(deployer.getSender(), toNano('0.05'), {
            queryId: 123n,
            key: 2n,
            validUntil: 2000n,
            value: beginCell().storeUint(234, 16).endCell().asSlice(),
        });
    
        await contract.sendSet(deployer.getSender(), toNano('0.05'), {
            queryId: 123n,
            key: 3n,
            validUntil: 3000n,
            value: beginCell().storeUint(345, 16).endCell().asSlice(),
        });
        console.log("added values")
    });
    it('should throw if op = 3', async () => {
        const result = await deployer.send({
            to: contract.address,
            value: toNano('1'),
            body: beginCell().storeUint(3, 32).storeUint(12345n, 64).endCell()
        });
        expect(result.transactions).toHaveTransaction({
            from: deployer.address,
            to: contract.address,
            success: false,
            exitCode: 1001
        });
    });
    it('should retrieve values', async () => {
        let [validUntil, value] = await contract.getKey(1n);
        expect(validUntil).toEqual(1000n);
        expect(value).toEqualSlice(
            beginCell().storeUint(123, 16).endCell().asSlice()
        );
        [validUntil, value] = await contract.getKey(2n);
        expect(validUntil).toEqual(2000n);
        expect(value).toEqualSlice(
            beginCell().storeUint(234, 16).endCell().asSlice()
        );
        [validUntil, value] = await contract.getKey(3n);
        expect(validUntil).toEqual(3000n);
        expect(value).toEqualSlice(
            beginCell().storeUint(345, 16).endCell().asSlice()
        );
        
    })

    it('should clear expired values', async () => {
        blockchain.now = 1500;
        await contract.sendClearOldValues(deployer.getSender(), toNano(0.1), 12345n);
        await expect(contract.getKey(1n)).rejects.toThrow()
    })

    it('should throw on bad query', async () => {
        const result = await deployer.send({
            to: contract.address,
            value: toNano('0.05'),
            body: beginCell()
                .storeUint(2, 32)
                .storeUint(123, 64)
                .storeStringTail('This string should not be here!')
                .endCell(),
        });
        expect(result.transactions).toHaveTransaction({
            from: deployer.address,
            to: contract.address,
            success: false,
        });
    });

    it('should throw on not found key', async () => {
        await expect(contract.getKey(1333n)).rejects.toThrow()
        
    })
    
        
})
