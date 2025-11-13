import { CONFIG, PROTOCOL_STABLECOIN_NAME } from 'api.config';
import { FrontendCodeSavingsQuery } from 'frontendcode/frontendcode.types';
import { createRefCodeLabelLink } from 'socialmedia/socialmedia.helper';
import { formatCurrency } from 'utils/format';
import { ExplorerAddressUrl, ExplorerTxUrl } from 'utils/func-helper';
import { formatUnits } from 'viem';

export function SavingUpdateMessage(saving: FrontendCodeSavingsQuery): string[] {
	const refCodeLabelLink = createRefCodeLabelLink(saving.frontendCode);
	const usedRef = refCodeLabelLink ? `🪢 used Ref: ${refCodeLabelLink}` : '';

	const message = `
*New ${PROTOCOL_STABLECOIN_NAME} Savings!*

🔏 Savings Amount: *${formatCurrency(formatUnits(BigInt(saving.amount), 18))}*
🧲 ${formatCurrency(formatUnits(BigInt(saving.rate), 4))}% APR
👤 [Saver](${ExplorerAddressUrl(saving.account)}) / [TX](${ExplorerTxUrl(saving.txHash)})
${usedRef}
`;

	const image = `${CONFIG.telegram.imagesDir}/Savings.mp4`;

	return [message, image];
}
