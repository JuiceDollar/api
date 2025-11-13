import { gql } from '@apollo/client/core';
import { ADDRESS, EquityABI, JuiceDollarABI as ProtocolStablecoinABI } from '@juicedollar/jusd';
import { Injectable, Logger } from '@nestjs/common';
import { PONDER_CLIENT } from 'api.apollo.config';
import { VIEM_CONFIG } from 'api.config';
import { PositionsService } from 'positions/positions.service';
import { formatUnits } from 'viem';
import { ApiEcosystemPoolSharesInfo } from './ecosystem.poolshares.types';
@Injectable()
export class EcosystemPoolSharesService {
	private readonly logger = new Logger(this.constructor.name);
	private poolSharesInfo: ApiEcosystemPoolSharesInfo;

	constructor(private readonly positionsService: PositionsService) {}

	getEcosystemPoolSharesInfo(): ApiEcosystemPoolSharesInfo {
		return this.poolSharesInfo;
	}

	async updatePoolSharesInfo() {
		this.logger.debug('Updating EcosystemPoolSharesInfo');

		const chainId = VIEM_CONFIG.chain.id;
		const addr = ADDRESS[chainId].equity;

		const fetchedPrice = await VIEM_CONFIG.readContract({
			address: addr,
			abi: EquityABI,
			functionName: 'price',
		});
		const fetchedTotalSupply = await VIEM_CONFIG.readContract({
			address: addr,
			abi: EquityABI,
			functionName: 'totalSupply',
		});

		const minterReserveRaw = await VIEM_CONFIG.readContract({
			address: ADDRESS[VIEM_CONFIG.chain.id].juiceDollar,
			abi: ProtocolStablecoinABI,
			functionName: 'minterReserve',
		});

		const balanceReserveRaw = await VIEM_CONFIG.readContract({
			address: ADDRESS[VIEM_CONFIG.chain.id].juiceDollar,
			abi: ProtocolStablecoinABI,
			functionName: 'balanceOf',
			args: [ADDRESS[VIEM_CONFIG.chain.id].equity],
		});

		const p = parseInt(fetchedPrice.toString()) / 1e18;
		const s = parseInt(fetchedTotalSupply.toString()) / 1e18;

		const profitLossPonder = await PONDER_CLIENT.query({
			fetchPolicy: 'no-cache',
			query: gql`
				query GetPoolShares {
					poolShares(orderBy: "id", limit: 1000) {
						items {
							id
							profits
							loss
						}
					}
				}
			`,
		});

		if (!profitLossPonder.data || !profitLossPonder.data.poolShares.items.length) {
			this.logger.warn('No profitLossPonder data found.');
			return;
		}

		const d = profitLossPonder.data.poolShares.items.at(0);
		const unrealizedProfit = this.getUnrealizedProfit();
		const earningsData: ApiEcosystemPoolSharesInfo['earnings'] = {
			profit: parseFloat(formatUnits(d.profits, 18)),
			loss: parseFloat(formatUnits(d.loss, 18)),
			unrealizedProfit: parseFloat(formatUnits(unrealizedProfit, 18)),
		};

		const equityInReserveRaw = balanceReserveRaw - minterReserveRaw;

		const balanceReserve = parseFloat(formatUnits(balanceReserveRaw, 18));
		const equityInReserve = parseFloat(formatUnits(equityInReserveRaw, 18));
		const minterReserve = parseFloat(formatUnits(minterReserveRaw, 18));

		this.poolSharesInfo = {
			earnings: earningsData,
			values: {
				price: p,
				totalSupply: s,
				poolSharesMarketCapInChf: p * s,
			},
			reserve: {
				balance: balanceReserve,
				equity: equityInReserve,
				minter: minterReserve,
			},
		};
	}

	private getUnrealizedProfit(): bigint {
		const positions = this.positionsService.getPositionsList().list;
		const openPositions = positions.filter((p) => !p.closed && !p.denied);

		const unrealizedProfit = openPositions.reduce((acc, p) => {
			return acc + BigInt(p.interest);
		}, 0n);

		return unrealizedProfit;
	}

	getTotalSupply(): number {
		return this.poolSharesInfo?.values?.totalSupply ?? 0;
	}
}
