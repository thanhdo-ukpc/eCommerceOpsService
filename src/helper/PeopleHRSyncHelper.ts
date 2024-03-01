import * as lodash from 'lodash';
import * as moment from 'moment';

import { LeaveDay, LeaveDayDuration, LeaveDayStatus, LeaveDayType, Warden, WardenType } from '@WardenOps/model';
import axios from 'axios';
const https = require('https');

axios.defaults.timeout = 60 * 1000;
axios.defaults.httpsAgent = new https.Agent({ keepAlive: true });

export class PeopleHRSyncHelper {
    private readonly ServiceAPIKey = process.env.PEOPLE_HR_SERVICE_API_KEY;

    private readonly ServiceQueryURL = 'https://api.peoplehr.net/Query';
    private readonly ServiceEmployeeURL = 'https://api.peoplehr.net/Employee';

    private readonly ServiceQueryAction = 'GetQueryResult';
    private readonly ServiceEmployeeAction = 'GetAllEmployeeDetail';

    private readonly QueryNameEmployee = 'Sync-Employee';
    private readonly QueryNameHoliday = 'Sync-Holiday';
    private readonly QueryNameOtherEvent = 'Sync-OtherEvent';
    private readonly QueryNameAbsence = 'Sync-Absence';
    private readonly QueryNameSalary = 'Sync-Salary';

    getWardenWithLeaveDays = async () => {
        const [wardens, leaveDays] = await Promise.all([await this.getWardens(), await this.getLeaveDays()]);

        const wardensHash = lodash.keyBy(wardens, 'ExternalId');

        const leaveDaysClean = leaveDays
            .map((leaveDay) => {
                leaveDay.WardenId = wardensHash[leaveDay.WardenId]?.ExternalId as any;
                return leaveDay;
            })
            .filter((leaveDay) => leaveDay.WardenId);

        return { wardens, leaveDays: leaveDaysClean };
    };

    private syncDataByQueryName = async (QueryName: string) => {
        const Results: any[] = await axios
            .post(this.ServiceQueryURL, {
                APIKey: this.ServiceAPIKey,
                Action: this.ServiceQueryAction,
                QueryName,
            })
            .then((res) => res.data.Result || []);

        return Results;
    };

    private syncAllEmployeeDetail = async () => {
        const employees: any[] = await axios
            .post(this.ServiceEmployeeURL, {
                APIKey: this.ServiceAPIKey,
                Action: this.ServiceEmployeeAction,
                IncludeLeavers: 'false',
            })
            .then((res) => res.data.Result);

        return employees;
    };

    private syncEmployees = async () => {
        const [employees, employeesWithImage] = await Promise.all([
            await this.syncDataByQueryName(this.QueryNameEmployee),
            await this.syncAllEmployeeDetail(),
        ]);

        const employeesHasRoleWarden = employeesWithImage.map((e) => {
            return {
                Id: e.EmployeeId.DisplayValue,
                Picture: e.EmployeeImage,
                PerformanceID: e.EmploymentDetail.PerformanceID.DisplayValue,
            };
        });

        const employeesHasRoleWardenHash = lodash.keyBy(employeesHasRoleWarden, 'Id');

        employees.forEach((e) => {
            e['Picture'] = employeesHasRoleWardenHash[e['Employee Id']].Picture;
            e['Start Date'] = this.convertDateFormatToDate(e['Start Date']);
            e['PerformanceID'] = employeesHasRoleWardenHash[e['Employee Id']].PerformanceID;
        });

        return employees;
    };

    private getWardens = async () => {
        const employees = await this.syncEmployees();

        const wardens: Warden[] = employees.map((e) => {
            const EmployeeId = e['Employee Id'];
            const Postcode = e['Post Code'] ? (e['Post Code'] as string).trim().toLocaleUpperCase() : null;

            const PhoneNumber = e['Work Phone Number'] || e['Mobile Number'] || e['Personal Phone Number'];

            const newWarden: Warden = {
                ExternalId: EmployeeId,
                FirstName: e['First Name'],
                LastName: e['Last Name'],
                Email: e['Work Email'],
                Picture: e['Picture'],
                PhoneNumber,

                Postcode,

                ContractHours: e['Contracted Hours'],
                StartDate: e['Start Date'],
                PayrollId: e['Payroll ID'],
                JobTitle: e['Job Title'],
                PerformanceID: e['PerformanceID'],

                WardenType: WardenType.PERMANENT_STAFF,
            };

            return newWarden;
        });

        return wardens;
    };

    private getLeaveDays = async () => {
        const [holidays, otherEvents, absences] = await Promise.all([
            await this.syncDataByQueryName(this.QueryNameHoliday),
            await this.syncDataByQueryName(this.QueryNameOtherEvent),
            await this.syncDataByQueryName(this.QueryNameAbsence),
        ]);

        const leaveDay: LeaveDay[] = [];
        const leaveDaysTypeHoliday = this.convertHolidaysToLeaveDays(holidays);
        const leaveDaysTypeOtherEvent = this.convertOtherEventsToLeaveDays(otherEvents);
        const leaveDaysTypeAbsence = this.convertAbsencesToLeaveDays(absences);

        return leaveDay.concat(leaveDaysTypeHoliday, leaveDaysTypeOtherEvent, leaveDaysTypeAbsence);
    };

    async getEmployeesSalary(latestDateEffective: Date) {
        const salaryDetails: {
            'Employee Id': string;
            'Salary Effective Date': Date | string;
            'Salary Type': string;
            'Salary Amount': number;
        }[] = await this.syncDataByQueryName(this.QueryNameSalary);

        const salaryDetailsValid = salaryDetails
            .map((detail) => {
                return {
                    ...detail,
                    'Salary Effective Date': this.convertDateFormatToDate(detail['Salary Effective Date'] as string),
                };
            })
            .filter(
                (detail) =>
                    new Date(detail['Salary Effective Date']).getTime() <= new Date(latestDateEffective).getTime() &&
                    detail['Salary Type'] === 'Hourly Salary'
            )
            .sort(
                (a, b) =>
                    new Date(a['Salary Effective Date']).getTime() - new Date(b['Salary Effective Date']).getTime()
            );

        return lodash.keyBy(salaryDetailsValid, 'Employee Id');
    }

    private convertHolidaysToLeaveDays = (holidays: any[]) => {
        const leaveDays: LeaveDay[] = [];

        holidays.forEach((holiday) => {
            holiday['Holiday Start Date'] = this.convertDateFormatToDate(holiday['Holiday Start Date']);
            holiday['Holiday End Date'] = this.convertDateFormatToDate(holiday['Holiday End Date']);

            let TimeFrom = moment(holiday['Holiday Start Date']).startOf('day').toDate();
            let TimeTo = moment(holiday['Holiday End Date']).endOf('day').toDate();

            const WardenId = holiday['Employee Id'];
            const Type: LeaveDayType = LeaveDayType.HOLIDAY;
            const Status = this.convertPeopleHRLeaveDayStatus(holiday['Holiday Status']);
            const Comment = holiday['Holiday Comments'];

            if (holiday['Holiday Duration Type'] === 'Less than a day') {
                if (holiday['Part of the Day'] === 'AM') {
                    TimeTo = moment(TimeFrom).hours(12).toDate();
                } else {
                    TimeFrom = moment(TimeFrom).hours(12).toDate();
                }

                leaveDays.push({
                    WardenId,
                    Type,
                    Status,
                    Comment,
                    TimeFrom,
                    TimeTo,
                    Duration: LeaveDayDuration.HALF_DAY,
                });
            } else {
                const diffDays = moment(TimeTo).diff(TimeFrom, 'day') + 1;
                Array.from(new Array(diffDays)).forEach((day, index) => {
                    leaveDays.push({
                        WardenId,
                        Type,
                        Status,
                        Comment,
                        TimeFrom: moment(TimeFrom).startOf('day').add(index, 'day').toDate(),
                        TimeTo: moment(TimeFrom).endOf('day').add(index, 'day').toDate(),
                        Duration: LeaveDayDuration.FULL_DAY,
                    });
                });
            }
        });

        return leaveDays;
    };

    private convertOtherEventsToLeaveDays = (otherEvents: any[]) => {
        const leaveDays: LeaveDay[] = [];

        otherEvents.forEach((otherEvent) => {
            otherEvent['Other Events Start Date'] = this.convertDateFormatToDate(otherEvent['Other Events Start Date']);
            otherEvent['Other Events End Date'] = this.convertDateFormatToDate(otherEvent['Other Events End Date']);

            let TimeFrom = moment(otherEvent['Other Events Start Date']).startOf('day').toDate();
            let TimeTo = moment(otherEvent['Other Events End Date']).endOf('day').toDate();

            const WardenId = otherEvent['Employee Id'];
            const Type = this.convertOtherEventReasonToLeaveDayType(otherEvent['Other Events Reason']);
            const Status = this.convertPeopleHRLeaveDayStatus(otherEvent['Other Events Status']);
            const Comment = otherEvent['Other Events Comments'];

            if (otherEvent['Other Events Duration Type'] === 'Days') {
                if (otherEvent['Other Events Total Duration (Days)'] >= 1) {
                    const diffDays = moment(TimeTo).diff(TimeFrom, 'day') + 1;
                    Array.from(new Array(diffDays)).forEach((day, index) => {
                        leaveDays.push({
                            WardenId,
                            Type,
                            Status,
                            Comment,
                            TimeFrom: moment(TimeFrom).startOf('day').add(index, 'day').toDate(),
                            TimeTo: moment(TimeFrom).endOf('day').add(index, 'day').toDate(),
                            Duration: LeaveDayDuration.FULL_DAY,
                        });
                    });
                } else {
                    leaveDays.push({
                        WardenId,
                        Type,
                        Status,
                        Comment,
                        TimeFrom: moment(TimeFrom).startOf('day').toDate(),
                        TimeTo: moment(TimeFrom).hour(12).toDate(),
                        Duration: LeaveDayDuration.HALF_DAY,
                    });
                }
            } else {
                const startHour = otherEvent['Other Events Start Time']['Hours'];
                const startMinute = otherEvent['Other Events Start Time']['Minutes'];

                const endHour = otherEvent['Other Events End Time']['Hours'];
                const endMinute = otherEvent['Other Events End Time']['Minutes'];

                leaveDays.push({
                    WardenId,
                    Type,
                    Status,
                    Comment,
                    TimeFrom: moment(TimeFrom).startOf('day').hour(startHour).minute(startMinute).toDate(),
                    TimeTo: moment(TimeFrom).startOf('day').hour(endHour).minute(endMinute).toDate(),
                    Duration: LeaveDayDuration.HOUR,
                });
            }
        });

        return leaveDays.filter((l) =>
            [LeaveDayType.ABSENT, LeaveDayType.UN_ABSENT, LeaveDayType.LIEU].includes(l.Type)
        );
    };

    private convertAbsencesToLeaveDays = (absences: any[]) => {
        const leaveDays: LeaveDay[] = [];

        absences.forEach((absence) => {
            absence['Sick Start Date'] = this.convertDateFormatToDate(absence['Sick Start Date']);
            absence['Sick End Date'] = this.convertDateFormatToDate(absence['Sick End Date']);

            let TimeFrom = moment(absence['Sick Start Date']).startOf('day').toDate();
            let TimeTo = moment(absence['Sick End Date']).endOf('day').toDate();

            const WardenId = absence['Employee Id'];
            const Type: LeaveDayType = LeaveDayType.SICK;
            const Status: LeaveDayStatus = 'approved';
            const Comment = absence['Sick Reason'];

            if (absence['Sick Duration Type'] === 'Full day') {
                const diffDays = moment(TimeTo).diff(TimeFrom, 'day') + 1;
                Array.from(new Array(diffDays)).forEach((day, index) => {
                    leaveDays.push({
                        WardenId,
                        Type,
                        Status,
                        Comment,
                        TimeFrom: moment(TimeFrom).startOf('day').add(index, 'day').toDate(),
                        TimeTo: moment(TimeFrom).endOf('day').add(index, 'day').toDate(),
                        Duration: LeaveDayDuration.FULL_DAY,
                    });
                });
            } else {
                if (absence['Sick (AM/PM)'] === 'AM') {
                    TimeTo = moment(TimeFrom).hours(12).toDate();
                } else {
                    TimeFrom = moment(TimeFrom).hours(12).toDate();
                }

                leaveDays.push({
                    WardenId,
                    Type,
                    Status,
                    Comment,
                    TimeFrom,
                    TimeTo,
                    Duration: LeaveDayDuration.HALF_DAY,
                });
            }
        });

        return leaveDays;
    };

    private convertDateFormatToDate = (dateFormat: string) => {
        return moment(dateFormat, 'DD/MM/YYYY').toDate();
    };

    private convertOtherEventReasonToLeaveDayType(otherEventReason: string) {
        let leaveDayType: LeaveDayType = LeaveDayType.OTHER;

        switch (otherEventReason) {
            case 'Absent':
                leaveDayType = LeaveDayType.ABSENT;
                break;

            case 'Un Absent':
                leaveDayType = LeaveDayType.UN_ABSENT;
                break;

            case 'TOIL':
                leaveDayType = LeaveDayType.LIEU;
                break;

            default:
                break;
        }

        return leaveDayType;
    }

    private convertPeopleHRLeaveDayStatus = (leaveStatus: string) => {
        let leaveDayStatus: LeaveDayStatus = null;

        switch (leaveStatus) {
            case 'Submitted':
                leaveDayStatus = 'pending';
                break;

            case 'Approved':
                leaveDayStatus = 'approved';
                break;

            case 'Rejected':
                leaveDayStatus = 'decline';
                break;

            default:
                break;
        }

        return leaveDayStatus;
    };
}

export const peopleHRSyncHelper = new PeopleHRSyncHelper();
