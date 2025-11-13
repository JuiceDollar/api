import { CONFIG, PROTOCOL_STABLECOIN_NAME } from 'api.config';
import { EcosystemMintQueryItem } from 'ecosystem/ecosystem.stablecoin.types';
import { formatCurrency } from 'utils/format';
import { ExplorerAddressUrl, ExplorerTxUrl } from 'utils/func-helper';
import { formatUnits } from 'viem';

export function MintingUpdateMessage(mint: EcosystemMintQueryItem): string[] {
	const message = `
*New ${PROTOCOL_STABLECOIN_NAME} Mint!*

🏦 Lending Amount: *${formatCurrency(formatUnits(BigInt(mint.value), 18))}*
👤 [Lendner](${ExplorerAddressUrl(mint.to)}) / [TX](${ExplorerTxUrl(mint.txHash)})
`;

	const image = `${CONFIG.telegram.imagesDir}/Lending.mp4`;

	return [message, image];
}
