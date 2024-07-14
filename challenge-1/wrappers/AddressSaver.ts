import { Address, beginCell, Cell, Contract, contractAddress, ContractProvider, Sender, SendMode } from '@ton/core';

export type AddressSaverConfig = {
    manager: Address;
};

//saved address be empty by default expressed as two zeros
export function addressSaverConfigToCell(config: AddressSaverConfig): Cell {
    return beginCell().storeAddress(config.manager).storeInt(0, 2).endCell();
}

export class AddressSaver implements Contract {
    constructor(
        readonly address: Address,
        readonly init?: { code: Cell; data: Cell }
    ) {}

    static createFromAddress(address: Address) {
        return new AddressSaver(address);
    }

    static createFromConfig(config: AddressSaverConfig, code: Cell, workchain = 0) {
        const data = addressSaverConfigToCell(config);
        const init = { code, data };
        return new AddressSaver(contractAddress(workchain, init), init);
    }

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().endCell(),
        });
    }

    async sendChangeAddress(provider: ContractProvider, via: Sender, value: bigint, queryId: bigint, newAddress: Address) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeUint(1, 32)
                .storeUint(queryId, 64)
                .storeAddress(newAddress)
                .endCell()
                
        })
    }

    async sendRequestAddress(provider: ContractProvider, via: Sender, value: bigint, queryId: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().storeUint(2, 32).storeUint(queryId, 64).endCell(),
        });
    }

    async getCurrentSavedAddress(provider: ContractProvider) {
        const result = (await provider.get('get_addresses', [])).stack;
        // console.log(result.readAddress())
        const manager = result.readAddress();
        const saved = result.readAddress();
        return [manager, saved]
        
    }
    
}

export default AddressSaver