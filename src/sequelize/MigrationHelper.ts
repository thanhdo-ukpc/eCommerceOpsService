import * as glob from 'glob';
import { Options, Sequelize } from 'sequelize';
import * as Umzug from 'umzug';

export class MigrationHelper {
    sequelize: Sequelize;
    constructor(private options: Options) {
        this.sequelize = new Sequelize(options.database, options.username, options.password, options);
    }

    async startMigration(paths: string[]) {
        for (const pattern of paths) {
            let folders = glob.sync(pattern, { absolute: true }).sort();
            for (let folder of folders) {
                const umzug = new Umzug({
                    migrations: {
                        // eslint-disable-next-line @typescript-eslint/no-var-requires
                        path: folder,
                        params: [this.sequelize],
                        pattern: /\.(js|ts)$/,
                    },
                    storage: 'sequelize',
                    logging: false,
                    storageOptions: {
                        sequelize: this.sequelize,
                    },
                });
                try {
                    await umzug.up();
                } catch (error) {
                    console.log(error);
                    throw Error(error);
                }
            }
        }
    }
}
