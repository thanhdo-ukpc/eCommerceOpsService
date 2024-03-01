import { Model, ModelAttributes, ModelOptions, Sequelize } from 'sequelize';
import { BaseAttr, BaseAttrWithoutId } from './BaseSequelize';

export function sequelizeFactory<T>(
    connection: Sequelize,
    tableName: string,
    model: ModelAttributes<Model<T, T>, T>,
    option?: ModelOptions<Model<T, T>> & { excludeId?: boolean }
) {
    return connection.define<Model<T, T>, T>(
        tableName,
        {
            ...(option?.excludeId ? BaseAttrWithoutId : BaseAttr),
            ...model,
        },
        {
            freezeTableName: true,
            paranoid: true,
            deletedAt: 'Deleted',
            createdAt: 'Created',
            updatedAt: false,
            ...option,
        }
    );
}
export function sequelizeFactoryParanoidFalse<T>(
    connection: Sequelize,
    tableName: string,
    model: ModelAttributes<Model<T, T>, T>,
    option?: ModelOptions<Model<T, T>> & { excludeId?: boolean }
) {
    return connection.define<Model<T, T>, T>(
        tableName,
        {
            ...model,
        },
        {
            freezeTableName: true,
            paranoid: false,
            deletedAt: false,
            createdAt: false,
            updatedAt: false,
            ...option,
        }
    );
}
