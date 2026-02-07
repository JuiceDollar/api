import { ADDRESS } from '@juicedollar/jusd';
import { CONFIG } from 'api.config';

export enum StablecoinEnum {
	StartUSD = 'StartUSD',
	USDCe = 'USDC.e',
	USDTe = 'USDT.e',
	ctUSD = 'ctUSD',
}

const ADDR = ADDRESS[CONFIG.chain.id];

// Map enum values to lowercased stablecoin token addresses (skipping undefined for testnet)
export const STABLECOIN_ADDRESS: Partial<Record<StablecoinEnum, string>> = {
	...(ADDR?.startUSD ? { [StablecoinEnum.StartUSD]: ADDR.startUSD.toLowerCase() } : {}),
	...(ADDR?.USDC ? { [StablecoinEnum.USDCe]: ADDR.USDC.toLowerCase() } : {}),
	...(ADDR?.USDT ? { [StablecoinEnum.USDTe]: ADDR.USDT.toLowerCase() } : {}),
	...(ADDR?.CTUSD ? { [StablecoinEnum.ctUSD]: ADDR.CTUSD.toLowerCase() } : {}),
};