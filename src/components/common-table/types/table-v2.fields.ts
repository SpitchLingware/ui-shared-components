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
    /** The operator the column starts on, when the one its type defaults to is
     *  the wrong question to ask. A phone number or an e-mail is looked for by
     *  a fragment, so such a column says `contains` and does not leave the
     *  operator menu as the only way to get there.
     */
    operator?: string;
    /** `false` keeps the column out of the filter panel: no chip, and the
     *  «add a filter» menu does not offer it.
     *
     *  It does NOT drop the column's entry from the filter list — that list is
     *  also the projection the backend selects by, so dropping an entry takes
     *  the column out of the response. The entry travels on, empty.
     */
    filterable?: boolean;
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
