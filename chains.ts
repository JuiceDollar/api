import { defineChain } from 'viem';

export const mainnet = defineChain({
	id: 4114,
	name: 'Mainnet',
	nativeCurrency: { name: 'cBTC', symbol: 'cBTC', decimals: 18 },
	rpcUrls: {
		default: { http: ['https://rpc.citreascan.com'] },
	},
	blockExplorers: {
		default: { name: 'CitreaScan', url: 'https://citreascan.com' },
	},
});
