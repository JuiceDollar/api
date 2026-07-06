import { Address, Chain, createPublicClient, http, zeroAddress } from 'viem';
import { ADDRESS } from '@juicedollar/jusd';
import { Logger } from '@nestjs/common';
import { mainnet } from 'chains';
import * as dotenv from 'dotenv';
dotenv.config();

// Verify environment
if (process.env.RPC_URL_MAINNET === undefined) throw new Error('RPC_URL_MAINNET not available');
// COINGECKO_BASE_URL is the origin the api calls — typically the in-cluster
// pricing-proxy (https://github.com/DFXswiss/pricing-proxy), but any
// CoinGecko-compatible host works. COINGECKO_API_KEY is optional and is
// only attached as `x-cg-pro-api-key` on every request when set (proxy mode
// leaves it unset because the proxy injects its own key).
if (!process.env.COINGECKO_BASE_URL) {
	throw new Error('COINGECKO_BASE_URL is not set');
}

// Config type
export type ConfigType = {
	app: string;
	indexer: string;
	indexerFallback: string;
	coingeckoBaseUrl: string;
	coingeckoApiKey: string | undefined;
	chain: Chain;
	network: {
		mainnet: string;
	};
	telegram: {
		botToken: string;
		groupsJson: string;
		imagesDir: string;
	} | null;
	twitter: {
		accessToken: string;
		accessSecret: string;
		appKey: string;
		appSecret: string;
		imagesDir: string;
	} | null;
};

// Create config
export const CONFIG: ConfigType = {
	app: process.env.CONFIG_APP_URL,
	indexer: process.env.CONFIG_INDEXER_URL,
	indexerFallback: process.env.CONFIG_INDEXER_FALLBACK_URL,
	coingeckoBaseUrl: process.env.COINGECKO_BASE_URL,
	coingeckoApiKey: process.env.COINGECKO_API_KEY || undefined,
	chain: mainnet,
	network: {
		mainnet: process.env.RPC_URL_MAINNET,
	},
	telegram: process.env.TELEGRAM_BOT_TOKEN
		? {
				botToken: process.env.TELEGRAM_BOT_TOKEN,
				groupsJson: process.env.TELEGRAM_GROUPS_JSON,
				imagesDir: process.env.TELEGRAM_IMAGES_DIR,
			}
		: null,
	twitter: process.env.TWITTER_CLIENT_APP_KEY
		? {
				appKey: process.env.TWITTER_CLIENT_APP_KEY,
				appSecret: process.env.TWITTER_CLIENT_APP_SECRET,
				accessToken: process.env.TWITTER_ACCESS_TOKEN,
				accessSecret: process.env.TWITTER_ACCESS_SECRET,
				imagesDir: process.env.TWITTER_IMAGES_DIR,
			}
		: null,
};

const SENSITIVE_KEYS = new Set<string>([
	'coingeckoApiKey',
	'network.mainnet',
	'telegram.botToken',
	'twitter.appKey',
	'twitter.appSecret',
	'twitter.accessToken',
	'twitter.accessSecret',
]);

function redactConfig<T>(config: T): T {
	return walkRedact(config, '') as T;
}

function walkRedact(value: unknown, path: string): unknown {
	if (value && typeof value === 'object' && !Array.isArray(value)) {
		return Object.fromEntries(
			Object.entries(value as Record<string, unknown>).map(([key, val]) => {
				const childPath = path ? `${path}.${key}` : key;
				if (SENSITIVE_KEYS.has(childPath) && val) return [key, '***'];
				return [key, walkRedact(val, childPath)];
			})
		);
	}
	return value;
}

export function logConfig() {
	const logger = new Logger('ApiConfig');
	logger.log(`Starting API with this config:`);
	logger.log(JSON.stringify(redactConfig(CONFIG)));
}

// Refer to https://github.com/yagop/node-telegram-bot-api/blob/master/doc/usage.md#sending-files
process.env.NTBA_FIX_350 = 'true';

// VIEM CONFIG
export const VIEM_CHAIN = CONFIG.chain;
export const VIEM_CONFIG = createPublicClient({
	chain: VIEM_CHAIN,
	transport: http(CONFIG.network.mainnet),
	batch: {
		multicall: {
			wait: 200,
		},
	},
});

// COINGECKO CLIENT
//
// Calls go to whatever `COINGECKO_BASE_URL` points at. When the optional
// `COINGECKO_API_KEY` is set, it is attached as the `x-cg-pro-api-key`
// header — orthogonal to the base URL, never a fallback. The recommended
// deployment is the in-cluster pricing-proxy
// (https://github.com/DFXswiss/pricing-proxy), which injects its own key
// and leaves COINGECKO_API_KEY unset on every consumer.
export const COINGECKO_CLIENT = (query: string) => {
	const headers: Record<string, string> = { accept: 'application/json' };
	if (CONFIG.coingeckoApiKey) {
		headers['x-cg-pro-api-key'] = CONFIG.coingeckoApiKey;
	}
	return fetch(`${CONFIG.coingeckoBaseUrl}${query}`, { headers });
};

export const PROTOCOL_STABLECOIN_SYMBOL = 'JUSD';
export const PROTOCOL_STABLECOIN_NAME = 'Juice Dollar';
export const POOL_SHARES_SYMBOL = 'JUICE';

// Contract addresses for the active chain
export const ADDR = ADDRESS[CONFIG.chain.id];

export function isDeployed(addr: string | undefined): addr is Address {
	return !!addr && addr !== zeroAddress;
}

export function isV3Hub(hubAddress: Address): boolean {
	return isDeployed(ADDR.mintingHub) && hubAddress.toLowerCase() === ADDR.mintingHub.toLowerCase();
}
