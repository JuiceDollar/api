import { Controller, Get } from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { POOL_SHARES_SYMBOL } from 'api.config';
import { AnalyticsService } from './analytics.service';

@ApiTags('Analytics Controller')
@Controller('analytics')
export class AnalyticsController {
	constructor(private readonly analytics: AnalyticsService) {}

	@Get('poolshares/exposure')
	@ApiResponse({
		description: `Returns info about the exposures within the ${POOL_SHARES_SYMBOL} token`,
	})
	getExposure() {
		return this.analytics.getCollateralExposure();
	}

	@Get('poolshares/earnings')
	@ApiResponse({
		description: `Returns earnings from the ${POOL_SHARES_SYMBOL} token`,
	})
	getEarnings() {
		return this.analytics.getPoolSharesEarnings();
	}
}
