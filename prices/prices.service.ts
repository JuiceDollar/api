import { ADDRESS } from '@juicedollar/jusd';
import { Injectable, Logger } from '@nestjs/common';
import { COINGECKO_CLIENT, VIEM_CHAIN } from 'api.config';
import { EcosystemPoolSharesService } from 'ecosystem/ecosystem.poolshares.service';
import { PositionsService } from 'positions/positions.service';
import { Address } from 'viem';
import {
	ApiPriceERC20,
	ApiPriceERC20Mapping,
	ApiPriceListing,
	ApiPriceMapping,
	ERC20Info,
	ERC20InfoObjectArray,
	PriceQueryCurrencies,
	PriceQueryObjectArray,
} from './prices.types';

// Mapping of testnet token symbols to Coingecko IDs for real price fetching
const TESTNET_COINGECKO_MAPPING: Record<string, string | null> = {
	WCBTC: 'bitcoin',
	WBTC: 'bitcoin',
	WETH: 'ethereum',
	ETH: 'ethereum',
	BTC: 'bitcoin',
	JUSD: null, // Stablecoin, use hardcoded $1
};

@Injectable()
export class PricesService {
	private readonly logger = new Logger(this.constructor.name);
	private fetchedPrices: PriceQueryObjectArray = {};
	private poolSharesPrice: PriceQueryCurrencies = {};

	constructor(
		private readonly positionsService: PositionsService,
		private readonly poolShares: EcosystemPoolSharesService
	) {}

	getPrices(): ApiPriceListing {
		return Object.values(this.fetchedPrices);
	}

	getPricesMapping(): ApiPriceMapping {
		return this.fetchedPrices;
	}

	getMint(): ApiPriceERC20 {
		const p = Object.values(this.positionsService.getPositionsList().list)[0];
		if (!p) return null;
		return {
			address: p.stablecoinAddress,
			name: p.stablecoinName,
			symbol: p.stablecoinSymbol,
			decimals: p.stablecoinDecimals,
		};
	}

	getPoolShares(): ApiPriceERC20 {
		return {
			address: ADDRESS[VIEM_CHAIN.id].equity,
			name: 'Juice Protocol',
			symbol: 'JUICE',
			decimals: 18,
		};
	}

	async getPoolSharesPrice(): Promise<PriceQueryCurrencies> {
		if (!this.poolSharesPrice?.usd) {
			this.poolSharesPrice = await this.fetchFromEcosystemSharePools(this.getPoolShares());
		}
		return {
			usd: Number(this.poolSharesPrice?.usd?.toFixed(4) || 0),
		};
	}

	getCollateral(): ApiPriceERC20Mapping {
		const pos = Object.values(this.positionsService.getPositionsList().list);
		const c: ERC20InfoObjectArray = {};

		for (const p of pos) {
			c[p.collateral.toLowerCase()] = {
				address: p.collateral,
				name: p.collateralName,
				symbol: p.collateralSymbol,
				decimals: p.collateralDecimals,
			};
		}

		return c;
	}

	async fetchFromEcosystemSharePools(erc: ERC20Info): Promise<PriceQueryCurrencies | null> {
		const price = this.poolShares.getEcosystemPoolSharesInfo()?.values?.price;
		if (!price) return null;

		// Price from ecosystem is already in JUSD, which equals USD (1 JUSD = 1 USD)
		this.poolSharesPrice = { usd: price };
		return this.poolSharesPrice;
	}

	async fetchSourcesCoingecko(erc: ERC20Info): Promise<PriceQueryCurrencies | null> {
		// all mainnet addresses
		if ((VIEM_CHAIN.id as number) === 1) {
			const url = `/api/v3/simple/token_price/ethereum?contract_addresses=${erc.address}&vs_currencies=usd`;
			const data = await (await COINGECKO_CLIENT(url)).json();
			if (data.status) {
				this.logger.debug(data.status?.error_message || 'Error fetching price from coingecko');
				return null;
			}
			const result = Object.values(data)[0] as { usd: number } | undefined;
			if (!result?.usd) {
				this.logger.warn(`No price data from Coingecko for ${erc.symbol} (${erc.address})`);
				return null;
			}
			return { usd: result.usd };
		} else {
			// Testnet: Map token symbols to real Coingecko prices
			const symbol = erc.symbol?.toUpperCase();
			const coingeckoId = symbol ? TESTNET_COINGECKO_MAPPING[symbol] : null;

			if (coingeckoId) {
				try {
					const url = `/api/v3/simple/price?ids=${coingeckoId}&vs_currencies=usd`;
					const data = await (await COINGECKO_CLIENT(url)).json();
					if (data[coingeckoId]?.usd) {
						this.logger.debug(`Fetched real price for ${erc.symbol} via ${coingeckoId}: $${data[coingeckoId].usd}`);
						return { usd: data[coingeckoId].usd };
					}
				} catch (error) {
					this.logger.warn(`Failed to fetch price for ${erc.symbol}: ${error.message || error}`);
				}
			}

			// Fallback for stablecoins and unknown tokens
			return { usd: 1 };
		}
	}

	async fetchPrice(erc: ERC20Info): Promise<PriceQueryCurrencies | null> {
		if (erc.address.toLowerCase() === ADDRESS[VIEM_CHAIN.id].equity.toLowerCase()) {
			return this.fetchFromEcosystemSharePools(erc);
		} else {
			return this.fetchSourcesCoingecko(erc);
		}
	}

	async updatePrices() {
		this.logger.debug('Updating Prices');

		const poolShares = this.getPoolShares();
		const mint = this.getMint();
		const c = this.getCollateral();

		if (!mint || Object.values(c).length == 0) return;

		// JUSD is always $1 (stablecoin) - no need to fetch from Coingecko
		const mintAddr = mint.address.toLowerCase() as Address;
		if (!this.fetchedPrices[mintAddr]) {
			this.fetchedPrices[mintAddr] = {
				...mint,
				timestamp: Date.now(),
				price: { usd: 1 },
			};
		}

		// Only fetch prices for poolShares and collateral tokens
		const a = [poolShares, ...Object.values(c)];

		const pricesQuery: PriceQueryObjectArray = {};
		let pricesQueryNewCount: number = 0;
		let pricesQueryNewCountFailed: number = 0;
		let pricesQueryUpdateCount: number = 0;
		let pricesQueryUpdateCountFailed: number = 0;

		for (const erc of a) {
			const addr = erc.address.toLowerCase() as Address;
			const oldEntry = this.fetchedPrices[addr];

			if (!oldEntry) {
				pricesQueryNewCount += 1;
				this.logger.debug(`Price for ${erc.name} not available, trying to fetch...`);
				const price = await this.fetchPrice(erc);
				if (!price?.usd) pricesQueryNewCountFailed += 1;

				pricesQuery[addr] = {
					...erc,
					timestamp: price?.usd ? Date.now() : 0,
					price: price?.usd ? price : { usd: 1 },
				};
			} else if (oldEntry.timestamp + 300_000 < Date.now()) {
				// needs to update => try to fetch
				pricesQueryUpdateCount += 1;
				this.logger.debug(`Price for ${erc.name} out of date, trying to fetch...`);
				const price = await this.fetchPrice(erc);

				if (!price?.usd) {
					pricesQueryUpdateCountFailed += 1;
				} else {
					pricesQuery[addr] = {
						...erc,
						timestamp: Date.now(),
						price,
					};
				}
			}
		}

		const updatesCnt = pricesQueryNewCount + pricesQueryUpdateCount;
		const fromNewStr = `from new ${pricesQueryNewCount - pricesQueryNewCountFailed} / ${pricesQueryNewCount}`;
		const fromUpdateStr = `from update ${pricesQueryUpdateCount - pricesQueryUpdateCountFailed} / ${pricesQueryUpdateCount}`;

		if (updatesCnt > 0) this.logger.log(`Prices merging, ${fromNewStr}, ${fromUpdateStr}`);
		this.fetchedPrices = { ...this.fetchedPrices, ...pricesQuery };
	}
}
