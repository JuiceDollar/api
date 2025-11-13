import { CONFIG, PROTOCOL_STABLECOIN_SYMBOL } from 'api.config';
import { StablecoinBridgeQuery } from 'bridge/bridge.types';
import { formatCurrency } from 'utils/format';
import { formatUnits } from 'viem';

export function StablecoinBridgeMessage(stablecoinBridge: StablecoinBridgeQuery, stablecoinParam: string): string[] {
	const stablecoin = stablecoinParam.toUpperCase();

	const message = `
New Swap!

↔️ ${stablecoin} > ${PROTOCOL_STABLECOIN_SYMBOL}
➡️ ${stablecoin} ${formatCurrency(formatUnits(BigInt(stablecoinBridge.amount), 18))}
⬅️ ${PROTOCOL_STABLECOIN_SYMBOL} ${formatCurrency(formatUnits(BigInt(stablecoinBridge.amount), 18))}

🔗 Verifiable on the blockchain
`;

	const image = `${CONFIG.twitter.imagesDir}/SwapStablecoin.png`;

	return [message, image];
}
