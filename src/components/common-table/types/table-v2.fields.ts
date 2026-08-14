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
    hidden?: boolean;
    /** ready-made header caption; wins over the `details:` i18n lookup */
    label?: string;
    /** initial column width in px; a stored user resize still wins */
    width?: number;
    minWidth?: number;
    align?: 'left' | 'center' | 'right';
    /** collapse the cell to one line with an ellipsis instead of wrapping */
    nowrap?: boolean;
    /**
     * This column absorbs whatever width is left over. It stops doing so once the user resizes
     * a column by hand: from then on the free space is shared proportionally, so the widths
     * they set keep their ratio to each other.
     */
    stretch?: boolean;
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
