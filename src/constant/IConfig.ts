/* eslint-disable prettier/prettier */
import { config } from 'dotenv';
import { Options } from 'sequelize';
config();

const getEnv = (key: string) => process.env[key];

export const IS_DEVELOPER_ENV = getEnv('NODE_ENV').toLowerCase() !== 'production';

export interface IConfig {
    connectDb: {
        anprTechOps: Options;
    };
    jwt: {
        secret: string;
        algorithm: string;
        maxExpires: number; // miliSecond
        timeRefresh: number; //miliSecond
    };
}

export const appConfig: IConfig = {
    connectDb: {
        anprTechOps: {
            dialect: 'mssql',
            host: getEnv('DB_HOST_ANPR_TECH_OPS'),
            port: Number(getEnv('DB_PORT_ANPR_TECH_OPS')),
            username: getEnv('DB_USERNAME_ANPR_TECH_OPS'),
            password: getEnv('DB_PASSWORD_ANPR_TECH_OPS'),
            database: getEnv('DB_NAME_ANPR_TECH_OPS'),
            logging: IS_DEVELOPER_ENV,
            define: {
                freezeTableName: true,
            },
        },
    },

    jwt: {
        secret: getEnv('JWT_SECRET_KEY') || 'ale123',
        algorithm: 'HS256',
        maxExpires: 1000 * 60 * 60 * 24 * 2,
        timeRefresh: 1000 * 60 * 60 * 10,
    },
};

const requiredENVs = (envs: string[]) => {
    envs.forEach((e) => {
        if (!getEnv(e)) throw new Error(`Cannot find environment ${e}`);
    });
};

console.log(`------- Load config with env is ${getEnv('NODE_ENV')}-------`);
console.log(appConfig);
