import { Address, zeroAddress } from 'viem';
import { ADDRESS, PositionV2ABI } from '@juicedollar/jusd';
import { CONFIG, VIEM_CONFIG } from '../api.config';

export const ADDR = ADDRESS[CONFIG.chain.id];

/** Check whether a contract address is deployed (non-zero, non-undefined). */
export function isDeployed(addr: string | undefined): addr is Address {
	return !!addr && addr !== zeroAddress;
}

// Position hub is immutable — safe to cache permanently.
const hubCache = new Map<string, Address>();

/** Read a position's hub address (cached). */
export async function getHubAddress(positionAddress: Address): Promise<Address> {
	const key = positionAddress.toLowerCase();
	const cached = hubCache.get(key);
	if (cached) return cached;

	const hub = await VIEM_CONFIG.readContract({
		abi: PositionV2ABI,
		address: positionAddress,
		functionName: 'hub',
		authorizationList: undefined,
	});

	hubCache.set(key, hub);
	return hub;
}

/** Whether the given hub address is the V3 MintingHub. */
export function isV3Hub(hubAddress: Address): boolean {
	return isDeployed(ADDR.mintingHub) && hubAddress.toLowerCase() === ADDR.mintingHub.toLowerCase();
}

/** Return the MintingHub contract address matching a position's hub. */
export function getMintingHubForHub(hubAddress: Address): Address {
	if (isV3Hub(hubAddress)) {
		return ADDR.mintingHub as Address;
	}
	return ADDR.mintingHubGateway as Address;
}
