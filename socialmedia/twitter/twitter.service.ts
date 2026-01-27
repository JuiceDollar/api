import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { CONFIG } from 'api.config';
import { StablecoinBridgeQuery } from 'bridge/bridge.types';
import { EcosystemMintQueryItem } from 'ecosystem/ecosystem.stablecoin.types';
import { FrontendCodeRegisteredQuery, FrontendCodeSavingsQuery } from 'frontendcode/frontendcode.types';
import { SocialMediaFct, SocialMediaService } from 'socialmedia/socialmedia.service';
import { TradeQuery } from 'trades/trade.types';
import { SendTweetV2Params, TwitterApi } from 'twitter-api-v2';
import { FrontendCodeRegisteredMessage } from './messages/FrontendCodeRegistered.message';
import { MintingUpdateMessage } from './messages/MintingUpdate.message';
import { SavingUpdateMessage } from './messages/SavingUpdate.message';
import { StablecoinBridgeMessage } from './messages/StablecoinBridgeUpdate.message';
import { TradeMessage } from './messages/Trade.message';

@Injectable()
export class TwitterService implements OnModuleInit, SocialMediaFct {
	private readonly logger = new Logger(this.constructor.name);
	private readonly client: TwitterApi | null;

	constructor(private readonly socialMediaService: SocialMediaService) {
		this.client = CONFIG.twitter
			? new TwitterApi({
					appKey: CONFIG.twitter.appKey,
					appSecret: CONFIG.twitter.appSecret,
					accessToken: CONFIG.twitter.accessToken,
					accessSecret: CONFIG.twitter.accessSecret,
				})
			: null;
	}

	async onModuleInit() {
		if (!this.client) return;

		this.socialMediaService.register(this.constructor.name, this);
	}

	async doSendUpdates(): Promise<void> {
		// not implemented yet
		return;
	}

	async doSendSavingUpdates(savingSaved: FrontendCodeSavingsQuery): Promise<void> {
		if (BigInt(savingSaved.amount) === 0n) return;
		const messageInfo = SavingUpdateMessage(savingSaved);
		await this.sendPost(messageInfo[0], messageInfo[1]);
	}

	async doSendFrontendCodeUpdates(frontendCodeRegistered: FrontendCodeRegisteredQuery): Promise<void> {
		const messageInfo = FrontendCodeRegisteredMessage(frontendCodeRegistered);
		await this.sendPost(messageInfo[0], messageInfo[1]);
	}

	async doSendTradeUpdates(trade: TradeQuery, poolSharesMarketCap: number, totalShares: bigint): Promise<void> {
		if (BigInt(trade.amount) === 0n) return;
		const messageInfo = TradeMessage(trade, poolSharesMarketCap, totalShares);
		await this.sendPost(messageInfo[0], messageInfo[1]);
	}

	async doSendBridgeUpdates(bridge: StablecoinBridgeQuery, stablecoin: string): Promise<void> {
		if (BigInt(bridge.amount) === 0n) return;
		const messageInfo = StablecoinBridgeMessage(bridge, stablecoin);
		this.sendPost(messageInfo[0], messageInfo[1]);
	}

	async doSendMintUpdates(mint: EcosystemMintQueryItem): Promise<void> {
		if (BigInt(mint.value) === 0n) return;
		const messageInfo = MintingUpdateMessage(mint);
		await this.sendPost(messageInfo[0], messageInfo[1]);
	}

	private async sendPost(message: string, media?: string): Promise<string | undefined> {
		if (!this.client) return;

		try {
			const tweetParams: Partial<SendTweetV2Params> = {
				text: message,
			};

			if (media) {
				const mediaId = await this.client.v1.uploadMedia(media).catch((e) => this.logger.error('uploadMedia failed', e));
				if (mediaId) tweetParams.media = { media_ids: [mediaId] };
			}

			const result = await this.client.v2.tweet(tweetParams).catch((e) => this.logger.error('tweet failed', e));
			if (!result) throw new Error('sendPost failed');
			if (result.errors) throw new Error(`sendPost failed: ${JSON.stringify(result.errors)}`);

			if (result.data) {
				return result.data.id;
			}
		} catch (e) {
			this.logger.error('sendPost failed', e);
		}
	}
}
