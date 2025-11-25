import { CONFIG, PROTOCOL_STABLECOIN_NAME } from 'api.config';
import { FrontendCodeRegisteredQuery } from 'frontendcode/frontendcode.types';
import { createRefCode } from 'socialmedia/socialmedia.helper';
import { ExplorerAddressUrl, ExplorerTxUrl } from 'utils/func-helper';

export function FrontendCodeRegisteredMessage(registered: FrontendCodeRegisteredQuery): string[] {
	const refCode = createRefCode(registered.frontendCode) ?? '';

	const message = `
*New ${PROTOCOL_STABLECOIN_NAME} Ambassador*

⚙️ Referral-Code: [${refCode}](https://app.juicedollar.com?ref=${refCode})
👤 [Referrer](${ExplorerAddressUrl(registered.owner)}) / [TX](${ExplorerTxUrl(registered.txHash)})
`;

	const image = `${CONFIG.telegram.imagesDir}/ReferralLink.mp4`;

	return [message, image];
}
