import { gql } from '@apollo/client/core';
import { Injectable } from '@nestjs/common';
import { PONDER_CLIENT } from 'api.apollo.config';
import { StablecoinBridgeQuery } from './bridge.types';
import { StablecoinEnum, STABLECOIN_ADDRESS } from './bridge.enum';

@Injectable()
export class BridgeService {
	async getBridgedStables(stablecoin: StablecoinEnum, timestamp: Date, minAmount: bigint): Promise<StablecoinBridgeQuery[]> {
		const address = STABLECOIN_ADDRESS[stablecoin];
		if (!address) return [];

		const checkTimestamp = Math.trunc(timestamp.getTime() / 1000);

		const bridgeFetched = await PONDER_CLIENT.query({
			fetchPolicy: 'no-cache',
			query: gql`
				query GetBridgeTxs {
					bridgeTxs(
						orderBy: "timestamp", orderDirection: "desc"
						where: {
							stablecoinAddress: "${address}"
							timestamp_gt: "${checkTimestamp}"
							amount_gte: "${minAmount}"
							isMint: true
						}
					) {
						items {
							stablecoinAddress
							swapper
							txHash
							amount
							isMint
							timestamp
						}
					}
				}
			`,
		});

		return bridgeFetched?.data?.bridgeTxs?.items ?? [];
	}
}
