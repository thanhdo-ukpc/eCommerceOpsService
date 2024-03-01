import * as moment from 'moment';
import * as momentTz from 'moment-timezone';

export const ONE_HOUR = 60; // 60 minutes
export const ONE_DAY = 24 * ONE_HOUR; // 24 hours

const DEFAULT_TIMEZONE = 'Europe/London';

interface IConvertTimeHelper {
    convertTimeToNumber(date: Date): number;
    convertNumberToTime(number: number, date: Date): Date;

    ceilTimeMinutes(minutes: number): number;
    floorTimeMinutes(minutes: number): number;

    isEndOfDate(date: Date): boolean;
    isStartOfDate(date: Date): boolean;

    getEndOfDate(date: Date): Date;
    getStartOfDate(date: Date): Date;
    getStartAndEndOfDate(date: Date): { startOfDate: Date; endOfDate: Date };

    getStartOfWeek(date: Date): Date;
    getEndOfWeek(date: Date): Date;
    getStartAndEndOfWeek(date: Date): { startOfWeek: Date; endOfWeek: Date };

    getCurrentTimezoneNumber(timezone: string): number;

    getStartOfDateByTimezone(date: Date, timezone: string): Date;
    getEndOfDateByTimezone(date: Date, timezone: string): Date;
    getStartAndEndOfDateByTimezone(date: Date, timezone: string): { startOfDate: Date; endOfDate: Date };
}

export class ConvertTimeHelper implements IConvertTimeHelper {
    convertTimeToNumber(date: Date) {
        if (this.isEndOfDate(date)) return ONE_DAY;

        const hours = moment(date).hours();
        const minuets = moment(date).minutes();

        return hours * ONE_HOUR + minuets;
    }

    convertNumberToTime(number: number, date: Date) {
        if (number === ONE_DAY) return this.getEndOfDate(date);

        const hours = Math.floor(number / ONE_HOUR);
        const minuets = number % ONE_HOUR;

        return moment(date).hours(hours).minutes(minuets).toDate();
    }

    ceilTimeMinutes(minutes: number): number {
        return Math.ceil(minutes / ONE_HOUR) * ONE_HOUR;
    }

    floorTimeMinutes(minutes: number): number {
        return Math.floor(minutes / ONE_HOUR) * ONE_HOUR;
    }

    isEndOfDate(date: Date) {
        return moment(date).isSame(moment(date).endOf('date'));
    }

    isStartOfDate(date: Date) {
        return moment(date).isSame(moment(date).startOf('date'));
    }

    getStartOfDate(date: Date) {
        return moment(date).startOf('day').toDate();
    }

    getEndOfDate(date: Date) {
        return moment(date).endOf('day').toDate();
    }

    getStartAndEndOfDate(date: Date) {
        const startOfDate = this.getStartOfDate(date);
        const endOfDate = this.getEndOfDate(date);
        return { startOfDate, endOfDate };
    }

    getStartOfWeek(date: Date) {
        return moment(date).startOf('isoWeek').toDate();
    }

    getEndOfWeek(date: Date) {
        return moment(date).endOf('isoWeek').toDate();
    }

    getStartAndEndOfWeek(date: Date) {
        const startOfWeek = this.getStartOfWeek(date);
        const endOfWeek = this.getEndOfWeek(date);
        return { startOfWeek, endOfWeek };
    }

    convertTimeToLondonTime(date: Date) {
        return new Date(momentTz(new Date(date)).tz('Europe/London').format('YYYY-MM-DD HH:mm:ss'));
    }

    convertLondonTimeToUTC(date: string) {
        moment(date).format();
        moment.tz.setDefault('Europe/London');
        const UTCTime = moment(date).toDate();
        moment.tz.setDefault();
        return UTCTime;
    }

    getCurrentTimezoneNumber(timezone = DEFAULT_TIMEZONE): number {
        const timezoneNumber = moment().tz(timezone).utcOffset() / 60;
        return timezoneNumber;
    }

    getStartOfDateByTimezone(date: Date, timezone = DEFAULT_TIMEZONE): Date {
        return moment(date).tz(timezone).startOf('day').toDate();
    }

    getEndOfDateByTimezone(date: Date, timezone = DEFAULT_TIMEZONE): Date {
        return moment(date).tz(timezone).endOf('day').toDate();
    }

    getStartAndEndOfDateByTimezone(date: Date, timezone = DEFAULT_TIMEZONE): { startOfDate: Date; endOfDate: Date } {
        const startOfDate = this.getStartOfDateByTimezone(date, timezone);
        const endOfDate = this.getEndOfDateByTimezone(date, timezone);

        return { startOfDate, endOfDate };
    }
}

export const convertTimeHelper = new ConvertTimeHelper();
