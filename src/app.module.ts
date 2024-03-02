import { Module } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { requirer } from './helper/Requirer';
import { appConfig } from './constant/IConfig';

@Module({
    controllers: [...requirer('dist/modules/*/controllers/*')],
    providers: [...requirer('dist/modules/*/services/*'), ...requirer('dist/modules/*/repositories/*')],
})
export class AppModule {}
