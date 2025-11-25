// --------------------------------------------------------------------------
// Ponder return types

import { Address } from 'viem';

// --------------------------------------------------------------------------
// Service
export type AnalyticsExposureItem = {
	collateral: {
		address: Address;
		chainId: number;
		name: string;
		symbol: string;
	};
	positions: {
		open: number;
		originals: number;
		clones: number;
	};
	mint: {
		totalMinted: number;
		totalContribution: number;
		totalLimit: number;
		totalMintedRatio: number;
		interestAverage: number;
		totalTheta: number;
		thetaPerPoolSharesToken: number;
	};
	reserveRiskWiped: {
		poolSharesPrice: number;
		riskRatio: number;
	};
};

// --------------------------------------------------------------------------
// Api
export type ApiAnalyticsCollateralExposure = {
	general: {
		balanceInReserve: number;
		mintersContribution: number;
		equityInReserve: number;
		poolSharesPrice: number;
		poolSharesTotalSupply: number;
		thetaFromPositions: number;
		thetaPerToken: number;
		earningsPerAnnum: number;
		earningsPerToken: number;
		priceToEarnings: number;
		priceToBookValue: number;
	};
	exposures: AnalyticsExposureItem[];
};

export type ApiAnalyticsPoolSharesEarnings = {
	investFees: number;
	redeemFees: number;
	minterProposalFees: number;
	positionProposalFees: number;
	otherProfitClaims: number;
	otherContributions: number;

	// loss or costs
	savingsInterestCosts: number;
	otherLossClaims: number;
};
