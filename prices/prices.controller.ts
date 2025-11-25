import { Controller, Get } from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { POOL_SHARES_SYMBOL } from 'api.config';
import { ApiPriceERC20, ApiPriceERC20Mapping, ApiPriceListing, ApiPriceMapping, PriceQueryCurrencies } from 'prices/prices.types';
import { PricesService } from './prices.service';

@ApiTags('Prices Controller')
@Controller('prices')
export class PricesController {
	constructor(private readonly pricesService: PricesService) {}

	@Get('list')
	@ApiResponse({
		description: 'Returns a list of price queries',
	})
	getList(): ApiPriceListing {
		return this.pricesService.getPrices();
	}

	@Get('mapping')
	@ApiResponse({
		description: 'Returns a mapping of price queries',
	})
	getListMapping(): ApiPriceMapping {
		return this.pricesService.getPricesMapping();
	}

	@Get('erc20/mint')
	@ApiResponse({
		description: 'Returns ERC20 information about the mint token',
	})
	getMint(): ApiPriceERC20 {
		return this.pricesService.getMint();
	}

	@Get('erc20/poolshares')
	@ApiResponse({
		description: `Returns ERC20 information about the ${POOL_SHARES_SYMBOL} token`,
	})
	getPoolShares(): ApiPriceERC20 {
		return this.pricesService.getPoolShares();
	}

	@Get('erc20/collateral')
	@ApiResponse({
		description: 'Returns a list of ERC20 information about collateral token',
	})
	getCollateral(): ApiPriceERC20Mapping {
		return this.pricesService.getCollateral();
	}

	@Get('eur')
	@ApiResponse({
		description: 'Returns the price of EUR in USD',
	})
	getEuroPrice(): Promise<PriceQueryCurrencies> {
		return this.pricesService.getEuroPrice();
	}

	@Get('poolshares')
	@ApiResponse({
		description: `Returns the current price of the ${POOL_SHARES_SYMBOL} token`,
	})
	getPoolSharesPrice(): Promise<PriceQueryCurrencies> {
		return this.pricesService.getPoolSharesPrice();
	}
}
