import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import * as appInsights from 'applicationinsights';
import { Request, Response } from 'express';
import * as moment from 'moment';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { IS_DEVELOPER_ENV } from './IConfig';

const excludeURL = ['/leave-day/statistics', '/alert/statistics'];

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<{}> {
        const ctx = context.switchToHttp();
        const request: Request = ctx.getRequest();

        const { originalUrl, method, params, query, body } = request;
        const user = request.user ? request.user['preferred_username'] : '';

        const timeStamp = new Date();
        const dataResponse = {
            originalUrl,
            method,
            params,
            query,
            body,
            user,
            clientVersion: request.headers['x-application-version'] || '',
            clientITicketLiteVersion: request.headers['x-iticketlite-version'] || '',
        };

        return next.handle().pipe(
            tap((data) => {
                console.info(`[HTTP INFO]: [${timeStamp.toISOString()}]`, JSON.stringify({ ...dataResponse, data }));

                const response: Response = context.switchToHttp().getResponse();
                const statusCode = response.statusCode;

                if (!IS_DEVELOPER_ENV && !excludeURL.includes(originalUrl)) {
                    const duration = moment().diff(timeStamp, 'milliseconds');
                    appInsights.defaultClient.trackRequest({
                        duration: duration,
                        name: method + ' ' + originalUrl,
                        resultCode: statusCode,
                        success: true,
                        url: originalUrl,
                        properties: { ...dataResponse, data },
                    });
                }
            })
        );
    }
}
