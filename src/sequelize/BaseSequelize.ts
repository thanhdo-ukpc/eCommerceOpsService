/* eslint-disable @typescript-eslint/no-empty-interface */
import { BaseModel } from '@Core';
import Sequelize from 'sequelize';

export type Attribute<T> = Sequelize.ModelAttributes<Sequelize.Model<T, T>>;
export type Option<T> = Sequelize.ModelOptions<Sequelize.Model<T, T>>;

export interface Model<T> {
    name: string;
    define: Attribute<T>;
    options: Option<T>;
}
export type DefinedModel<T> = Sequelize.ModelCtor<Sequelize.Model<T, unknown>>;

export const BaseAttrWithoutId: Attribute<BaseModel> = {
    Created: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('getdate'),
    },
    Deleted: {
        type: Sequelize.DATE,
    },
};

export const BaseAttr: Attribute<BaseModel> = {
    ...BaseAttrWithoutId,
    Id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
    },
};
