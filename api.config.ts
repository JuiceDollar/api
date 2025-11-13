import { Chain, createPublicClient, http } from 'viem';

import { Logger } from '@nestjs/common';
import { testnet } from 'chains';
import * as dotenv from 'dotenv';
dotenv.config();

// Verify environment
if (process.env.RPC_URL_MAINNET === undefined) throw new Error('RPC_URL_MAINNET not available');
if (process.env.COINGECKO_API_KEY === undefined) throw new Error('COINGECKO_API_KEY not available');

// Config type
export type ConfigType = {
	app: string;
	indexer: string;
	indexerFallback: string;
	coingeckoApiKey: string;
	chain: Chain;
	network: {
		mainnet: string;
		testnet: string;
	};
	telegram: {
		botToken: string;
		groupsJson: string;
		imagesDir: string;
	};
	twitter: {
		clientId: string;
		clientSecret: string;
		appKey: string;
		appSecret: string;
		tokenJson: string;
		imagesDir: string;
	};
};

// Create config
export const CONFIG: ConfigType = {
	app: process.env.CONFIG_APP_URL,
	indexer: process.env.CONFIG_INDEXER_URL,
	indexerFallback: process.env.CONFIG_INDEXER_FALLBACK_URL,
	coingeckoApiKey: process.env.COINGECKO_API_KEY,
	chain: testnet,
	network: {
		mainnet: process.env.RPC_URL_MAINNET,
		testnet: process.env.RPC_URL_MAINNET,
	},
	telegram: {
		botToken: process.env.TELEGRAM_BOT_TOKEN,
		groupsJson: process.env.TELEGRAM_GROUPS_JSON,
		imagesDir: process.env.TELEGRAM_IMAGES_DIR,
	},
	twitter: {
		clientId: process.env.TWITTER_CLIENT_ID,
		clientSecret: process.env.TWITTER_CLIENT_SECRET,
		appKey: process.env.TWITTER_CLIENT_APP_KEY,
		appSecret: process.env.TWITTER_CLIENT_APP_SECRET,
		tokenJson: process.env.TWITTER_TOKEN_JSON,
		imagesDir: process.env.TWITTER_IMAGES_DIR,
	},
};

export function logConfig() {
	const logger = new Logger('ApiConfig');
	logger.log(`Starting API with this config:`);
	logger.log(JSON.stringify(CONFIG));
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
export const COINGECKO_CLIENT = (query: string) => {
	const hasParams = query.includes('?');
	const uri: string = `https://pro-api.coingecko.com${query}`;
	return fetch(`${uri}${hasParams ? '&' : '?'}x_cg_pro_api_key=${CONFIG.coingeckoApiKey}`);
};

export const PROTOCOL_STABLECOIN_SYMBOL = 'JUSD';
export const PROTOCOL_STABLECOIN_NAME = 'Juice Dollar';
export const POOL_SHARES_SYMBOL = 'JUICE';
