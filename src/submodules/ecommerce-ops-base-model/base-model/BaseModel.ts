import { Identifiable } from "@Core";

export interface BaseModel extends Identifiable {
    Created?: Date;
    Updated?: Date;
    Deleted?: Date;
    CreatedBy?: string;
    UpdatedBy?: string;
}

export type OmitBaseModel<T extends BaseModel> = Omit<
    T,
    "Created" | "CreatedBy" | "Deleted" | "Updated" | "UpdatedBy"
>;
