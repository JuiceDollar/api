import { Address } from 'viem';

export type StablecoinBridgeQuery = {
	stablecoinAddress: string;
	txHash: string;
	swapper: Address;
	amount: string;
	isMint: boolean;
};
