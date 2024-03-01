import { Sequelize } from 'sequelize';
import { appConfig } from 'src/constant/IConfig';

export const sequelizeAnprConnector = new Sequelize(
  appConfig.connectDb.anprTechOps.database,
  appConfig.connectDb.anprTechOps.username,
  appConfig.connectDb.anprTechOps.password,
  appConfig.connectDb.anprTechOps,
);
