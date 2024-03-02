import { NestFactory } from '@nestjs/core';
import * as appInsights from 'applicationinsights';
import * as bodyParser from 'body-parser';
import * as cookieParser from 'cookie-parser';
import { config } from 'dotenv';
import { AppModule } from './app.module';

config();
const migrationWardenPaths = [`dist/*/warden/database/entities`, `dist/*/warden/database/seeders`];
// const migrationLocationPaths = [`dist/*/location/database/entities`, `dist/*/location/database/seeders`];

async function bootstrap() {
    // await new MigrationHelper(appConfig.connectDb.warden).startMigration(migrationWardenPaths);
    // await new MigrationHelper(appConfig.connectDb.location).startMigration(migrationLocationPaths);

    const app = await NestFactory.create(AppModule, { cors: false });
    app.enableCors({
        origin: true,
        methods: '*',
        credentials: true,
    });
    app.use(cookieParser());
    app.use(bodyParser.json({ limit: '50mb' }));
    app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

    await app.listen(process.env.PORT || 7003);
}
bootstrap();
