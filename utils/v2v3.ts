import { Address, zeroAddress } from 'viem';
import { ADDRESS } from '@juicedollar/jusd';
import { CONFIG } from '../api.config';

export const ADDR = ADDRESS[CONFIG.chain.id];

/** Check whether a contract address is deployed (non-zero, non-undefined). */
export function isDeployed(addr: string | undefined): addr is Address {
	return !!addr && addr !== zeroAddress;
}

/** Whether the given hub address is the V3 MintingHub. */
export function isV3Hub(hubAddress: Address): boolean {
	return isDeployed(ADDR.mintingHub) && hubAddress.toLowerCase() === ADDR.mintingHub.toLowerCase();
}
