import { Blockchain, RemoteBlockchainStorage, SandboxContract, TreasuryContract, wrapTonClient4ForRemote } from "@ton/sandbox";
import Proxy from "../wrappers/Proxy"
import { Cell, beginCell, toNano } from "@ton/core";
import "@ton/test-utils"; // register matchers
import * as fs from "fs";

let proxy: SandboxContract<Proxy>;
let deployer: SandboxContract<TreasuryContract>;
let blockchain: Blockchain;

describe("Proxy tests", () => {

    
    beforeEach(async () => {
        blockchain = await Blockchain.create();

        deployer = await blockchain.treasury('deployer');
        const code = Cell.fromBoc(fs.readFileSync("build/proxy.cell"))[0]; // compilation output from step 6
        proxy = blockchain.openContract(
            Proxy.createFromConfig(
                {
                    owner: deployer.address,
                },
                code
            )
        );

        const deployResult = await proxy.sendDeploy(
            deployer.getSender(),
            toNano('0.01')
        );

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: proxy.address,
            deploy: true,
        });
    });

    it('should not forward from owner', async () => {
        const result = await deployer.send({
            to: proxy.address,
            value: toNano('1'),
        });
        // console.log(result.transactions)
        expect(result.transactions).not.toHaveTransaction({
            from: proxy.address,
            to: deployer.address,
        });
    });

    it('should forward from another wallet', async () => {
        let user = await blockchain.treasury('user');
        const result = await user.send({
            to: proxy.address,
            value: toNano('1'),
            body: beginCell().storeStringTail('Hello, world!').endCell(),
        });
        // the transaction should be from proxy to deployer
        // body sender is user, msg body is hello world
        // value: func takes a value x and returns true if:
        // >= 0.99 TON and <= 1 TON. 
        expect(result.transactions).toHaveTransaction({
            from: proxy.address,
            to: deployer.address,
            body: beginCell()
                .storeAddress(user.address)
                .storeRef(beginCell().storeStringTail('Hello, world!').endCell())
                .endCell(),
            value: (x) => (x ? toNano('0.99') <= x && x <= toNano('1') : false),
        });
    });
})
