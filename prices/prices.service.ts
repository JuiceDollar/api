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

const randRef: number = Math.random() * 0.4 + 0.8;

// Mapping of testnet token symbols to Coingecko IDs for real price fetching
const TESTNET_COINGECKO_MAPPING: Record<string, string | null> = {
	WCBTC: 'bitcoin',
	WBTC: 'wrapped-bitcoin',
	WETH: 'ethereum',
	ETH: 'ethereum',
	BTC: 'bitcoin',
	JUSD: null, // Stablecoin, use hardcoded $1
};

@Injectable()
export class PricesService {
	private readonly logger = new Logger(this.constructor.name);
	private fetchedPrices: PriceQueryObjectArray = {};
	private euroPrice: PriceQueryCurrencies = {};
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
		if (!this.poolSharesPrice) this.poolSharesPrice = await this.fetchFromEcosystemSharePools(this.getPoolShares());
		if (!this.euroPrice) this.euroPrice = await this.fetchEuroPrice();

		return {
			usd: Number(this.poolSharesPrice.usd.toFixed(4)),
			eur: Number(this.poolSharesPrice.eur.toFixed(4)),
			btc: Number((this.poolSharesPrice.eur * this.euroPrice.btc).toFixed(9)),
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

	async getEuroPrice(): Promise<PriceQueryCurrencies> {
		if (!this.euroPrice) this.euroPrice = await this.fetchEuroPrice();

		return {
			usd: Number(this.euroPrice.usd.toFixed(4)),
			eur: Number(this.euroPrice.eur.toFixed(4)),
			btc: Number(this.euroPrice.btc.toFixed(9)),
		};
	}

	async fetchFromEcosystemSharePools(erc: ERC20Info): Promise<PriceQueryCurrencies | null> {
		const price = this.poolShares.getEcosystemPoolSharesInfo()?.values?.price;
		if (!price) return null;

		const protocolStablecoinAddress = ADDRESS[VIEM_CHAIN.id].juiceDollar.toLowerCase();
		const quote = this.euroPrice?.usd || this.fetchedPrices[protocolStablecoinAddress]?.price?.usd;
		const usdPrice = quote ? price * quote : price;

		this.poolSharesPrice = { usd: usdPrice, eur: price };
		return this.poolSharesPrice;
	}

	async fetchSourcesCoingecko(erc: ERC20Info): Promise<PriceQueryCurrencies | null> {
		// all mainnet addresses
		if ((VIEM_CHAIN.id as number) === 1) {
			const url = `/api/v3/simple/token_price/ethereum?contract_addresses=${erc.address}&vs_currencies=usd%2Ceur`;
			const data = await (await COINGECKO_CLIENT(url)).json();
			if (data.status) {
				this.logger.debug(data.status?.error_message || 'Error fetching price from coingecko');
				return null;
			}
			return Object.values(data)[0] as { usd: number; eur: number };
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
						// Only return USD - the 'eur' field (JUSD price) is calculated in updatePrices()
						return { usd: data[coingeckoId].usd };
					}
				} catch (error) {
					this.logger.warn(`Failed to fetch price for ${erc.symbol}: ${error.message || error}`);
				}
			}

			// Fallback for stablecoins and unknown tokens (eur/JUSD price calculated in updatePrices)
			return { usd: 1 };
		}
	}

	async fetchEuroPrice(): Promise<PriceQueryCurrencies | null> {
		const url = `/api/v3/simple/price?ids=usd&vs_currencies=eur%2Cbtc`;
		const data = await (await COINGECKO_CLIENT(url)).json();
		if (data.status) {
			this.logger.debug(data.status?.error_message || 'Error fetching price from coingecko');
			return null;
		}

		return {
			eur: 1,
			usd: 1 / Number(data.usd.eur),
			btc: 1 / Number(data.usd.eur / data.usd.btc),
		};
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

		const euroPrice = await this.fetchEuroPrice();
		if (euroPrice) this.euroPrice = euroPrice;

		const poolShares = this.getPoolShares();
		const m = this.getMint();
		const c = this.getCollateral();

		if (!m || Object.values(c).length == 0) return;
		const a = [poolShares, m, ...Object.values(c)];

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
				if (!price) pricesQueryNewCountFailed += 1;

				pricesQuery[addr] = {
					...erc,
					timestamp: price === null ? 0 : Date.now(),
					price: price === null ? { usd: 1 } : price,
				};
			} else if (oldEntry.timestamp + 300_000 < Date.now()) {
				// needs to update => try to fetch
				pricesQueryUpdateCount += 1;
				this.logger.debug(`Price for ${erc.name} out of date, trying to fetch...`);
				const price = await this.fetchPrice(erc);

				if (!price) {
					pricesQueryUpdateCountFailed += 1;
				} else {
					pricesQuery[addr] = {
						...erc,
						timestamp: Date.now(),
						price,
					};
				}
			}

			const protocolStablecoinPrice: number =
				this.euroPrice?.usd || this.fetchedPrices[ADDRESS[VIEM_CHAIN.id].juiceDollar.toLowerCase()]?.price?.usd;

			if (protocolStablecoinPrice) {
				const priceUsd = pricesQuery[addr]?.price?.usd;
				const priceEur = pricesQuery[addr]?.price?.eur;
				if (priceUsd && !priceEur) {
					pricesQuery[addr].price.eur = Math.round((priceUsd / protocolStablecoinPrice) * 100) / 100;
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
