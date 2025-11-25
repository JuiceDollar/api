import { CONFIG, PROTOCOL_STABLECOIN_NAME } from 'api.config';
import { FrontendCodeRegisteredQuery } from 'frontendcode/frontendcode.types';
import { createRefCode } from 'socialmedia/socialmedia.helper';

export function FrontendCodeRegisteredMessage(registered: FrontendCodeRegisteredQuery): string[] {
	const refCode = createRefCode(registered.frontendCode) ?? '';

	const message = `
New ${PROTOCOL_STABLECOIN_NAME} Ambassador

⚙️ Referral-Code: ${refCode}
🔗 Verifiable on the blockchain
`;

	const image = `${CONFIG.twitter.imagesDir}/ReferralLink.png`;

	return [message, image];
}
