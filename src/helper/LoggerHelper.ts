import * as moment from 'moment';

export class LoggerHelper {
    info(message?: string, ...optionalParams: any[]) {
        console.info(`[INFO][${this.current()}] - ${message}`, optionalParams);
    }

    debug(message?: string, ...optionalParams: any[]) {
        console.debug(`[DEBUG][${this.current()}] - ${message}`, optionalParams);
    }

    log(message?: string, ...optionalParams: any[]) {
        console.log(`[LOG][${this.current()}] - ${message}`, optionalParams);
    }

    error(message?: string, ...optionalParams: any[]) {
        console.error(`[ERROR][${this.current()}] - ${message}`, optionalParams);
    }

    warn(message?: string, ...optionalParams: any[]) {
        console.warn(`[WARN][${this.current()}] - ${message}`, optionalParams);
    }

    current() {
        return moment(new Date().getTime()).format('HH:mm:ss DD/MM/yyyy');
    }
}

export const logger = new LoggerHelper();
