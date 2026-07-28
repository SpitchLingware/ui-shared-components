import { ReactNode } from 'react';

export type TableField =
    | TableNumberField
    | TableDateField
    | TableBooleanField
    | TableSelectField
    | TableTextField
    | TableEntityField
    | TableUnknownField
    | TableObjectField
    | TableExtraField
    | TableExtensionField
    | TableActionField;

export type TableFieldParams = {
    /* object key */
    key: string;
    /* extracted value */
    value: any;
    /** original object */
    data: any;
};

type BaseField = {
    field: string;
    i18nTag?: string;
    render?: (params: TableFieldParams) => ReactNode;
    hidden?: boolean;
};

export type TableNumberField = BaseField & {
    type: 'number';
};

export type TableDateField = BaseField & {
    type: 'date';
};

export type TableBooleanField = BaseField & {
    type: 'boolean';
};
export type TableEntityField = BaseField & {
    type: 'entity';
    entityName: string;
};

export type TableExtraField = BaseField & {
    type: 'extra';
    selectType: string;
};

export type TableSelectField = BaseField & {
    type: 'select';
    title: string;
    options: Record<string, string>;
};

export type TableTextField = BaseField & {
    type: 'text';
};

export type TableExtensionField = BaseField & {
    type: 'extension';
};

export type TableUnknownField = BaseField & {
    type: 'unknown';
};

export type TableActionField = BaseField & {
    type: 'action';
};

export type ObjectPredicate = {
    field: string;
    value: string;
};

export type TableObjectField = BaseField & {
    type: 'object';
    selectType?: string;
    path: string;
    key: string;
    predicates: Array<ObjectPredicate>;
};
