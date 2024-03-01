export class RoundNumberHelper {
    round(number: number, fractionDigits: number = 2) {
        const fixedNumber = this.getFixedNumber(fractionDigits);
        const result = Math.round((number + Number.EPSILON) * fixedNumber) / fixedNumber;
        return result;
    }

    private getFixedNumber(fractionDigits: number) {
        return Math.pow(10, fractionDigits);
    }
}

export const roundNumberHelper = new RoundNumberHelper();
