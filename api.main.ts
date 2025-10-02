import { ConsoleLogger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { logConfig } from 'api.config';
import { WinstonModule } from 'nest-winston';
import { format, transports } from 'winston';
import { AppModule } from './api.module';
// import * as dotenv from 'dotenv';
// dotenv.config();

async function bootstrap() {
	const logger = ['dev', 'prd'].includes(process.env.API_ENVIRONMENT)
		? WinstonModule.createLogger({
				level: process.env.LOG_LEVEL ? process.env.LOG_LEVEL : 'info',
				transports: [
					new transports.Console({
						format: format.combine(
							format.printf((info) => {
								return `${info.level} [${info.context}]: ${info.message}`;
							})
						),
					}),
				],
			})
		: new ConsoleLogger();

	const api = await NestFactory.create(AppModule, { cors: true, logger });

	const config = new DocumentBuilder()
		.setTitle(process.env.npm_package_name)
		.setDescription('The API description')
		.setVersion(process.env.npm_package_version)
		.build();
	const document = SwaggerModule.createDocument(api, config);
	SwaggerModule.setup('/', api, document, {
		swaggerOptions: {
			persistAuthorization: true,
		},
	});

	// Startup Message
	logConfig();

	await api.listen(process.env.PORT || 3000);
}
bootstrap();
