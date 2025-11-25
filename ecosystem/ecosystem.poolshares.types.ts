// --------------------------------------------------------------------------
// Ponder return types

// --------------------------------------------------------------------------
// Service

// --------------------------------------------------------------------------
// Api
export type ApiEcosystemPoolSharesInfo = {
	earnings: {
		profit: number;
		loss: number;
		unrealizedProfit: number;
	};
	values: {
		price: number;
		totalSupply: number;
		poolSharesMarketCapInChf: number;
	};
	reserve: {
		balance: number;
		equity: number;
		minter: number;
	};
};
