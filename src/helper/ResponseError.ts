import { HttpException, HttpStatus } from '@nestjs/common';

type ResponseErrorBadInput<T extends { [key: string]: any }> = {
    [P in keyof T]: {
        message: string;
        value?: any;
        metaData?: any;
    };
};

export class ResponseError extends Error {
    constructor(message: string, public readonly status: number) {
        super(message);
    }

    static alreadyExists(message: string): ResponseError {
        throw new HttpException(message || 'not found', 430);
    }

    static errorVersion(message: string): ResponseError {
        throw new HttpException('Please upgrade to version latest', HttpStatus.HTTP_VERSION_NOT_SUPPORTED);
    }

    static notFound(message: string): ResponseError {
        throw new HttpException(message || 'not found', HttpStatus.NOT_FOUND);
    }

    static badInput<T>(object: ResponseErrorBadInput<T> | string): ResponseError {
        throw new HttpException(object, HttpStatus.BAD_REQUEST);
    }

    static conflict(message: string): ResponseError {
        throw new HttpException(message || 'not found', HttpStatus.CONFLICT);
    }

    static lengthRequired(message: string): ResponseError {
        throw new HttpException(message || 'not found', HttpStatus.LENGTH_REQUIRED);
    }

    static unexpected(message: string): ResponseError {
        throw new HttpException(message || 'not found', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    static unauthenticated(): ResponseError {
        throw new HttpException('Authenticated', HttpStatus.UNAUTHORIZED);
    }

    // eslint-disable-next-line @typescript-eslint/no-inferrable-types
    static unauthorized(message: string = 'Unauthorized'): ResponseError {
        throw new HttpException(message, HttpStatus.FORBIDDEN);
    }

    static accepted(message: string): ResponseError {
        throw new HttpException(message, HttpStatus.ACCEPTED);
    }
}
