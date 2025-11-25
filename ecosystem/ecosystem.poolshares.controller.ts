import { Controller, Get } from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { POOL_SHARES_SYMBOL } from 'api.config';
import { EcosystemPoolSharesService } from './ecosystem.poolshares.service';
import { ApiEcosystemPoolSharesInfo } from './ecosystem.poolshares.types';

@ApiTags('Ecosystem Controller')
@Controller('ecosystem/poolshares')
export class EcosystemPoolSharesController {
	constructor(private readonly poolshares: EcosystemPoolSharesService) {}

	@Get('info')
	@ApiResponse({
		description: `Returns info about the ${POOL_SHARES_SYMBOL} token`,
	})
	getCollateralList(): ApiEcosystemPoolSharesInfo {
		return this.poolshares.getEcosystemPoolSharesInfo();
	}

	@Get('info/totalSupply')
	@ApiResponse({
		description: `Returns the total supply of the ${POOL_SHARES_SYMBOL} token`,
	})
	getTotalSupply(): number {
		return this.poolshares.getTotalSupply();
	}
}
