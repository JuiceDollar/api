import { CONFIG, POOL_SHARES_SYMBOL, PROTOCOL_STABLECOIN_SYMBOL } from 'api.config';
import { createRefCodeLabelLink } from 'socialmedia/socialmedia.helper';
import { TradeQuery } from 'trades/trade.types';
import { formatCurrency } from 'utils/format';
import { ExplorerAddressUrl, ExplorerTxUrl } from 'utils/func-helper';
import { formatUnits } from 'viem';

export function TradeMessage(trade: TradeQuery, marketCap: number, totalShares: bigint): string[] {
	const refCodeLabelLink = createRefCodeLabelLink(trade.frontendCode);
	const usedRef = refCodeLabelLink ? `🪢 used Ref: ${refCodeLabelLink}` : '';

	const actualShares = Number(formatUnits(totalShares, 18));
	const sharesBefore = actualShares - Number(formatUnits(BigInt(trade.shares), 18));
	const position = sharesBefore ? ((actualShares - sharesBefore) / sharesBefore) * 100 : 100;

	const price = Number(formatUnits(BigInt(trade.amount), 18)) / Number(formatUnits(BigInt(trade.shares), 18));

	const message = `
*${POOL_SHARES_SYMBOL} Invest!*

➡️ Spent ${formatCurrency(formatUnits(BigInt(trade.amount), 18))} ${PROTOCOL_STABLECOIN_SYMBOL} 
⬅️ Got ${formatCurrency(formatUnits(BigInt(trade.shares), 18))} ${POOL_SHARES_SYMBOL}
👤 [Buyer](${ExplorerAddressUrl(trade.trader)}) / [TX](${ExplorerTxUrl(trade.txHash)})
🪙 Position +${position.toFixed(2)}%
🏷 Price ${formatCurrency(price)} €
💸 Market Cap ${formatCurrency(marketCap)} €
${usedRef}
`;

	const image = `${CONFIG.telegram.imagesDir}/EquityInvest.mp4`;

	return [message, image];
}
