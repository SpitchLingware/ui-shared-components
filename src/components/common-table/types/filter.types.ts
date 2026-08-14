import { CommonTableV2FilterValue } from './table-v2.types';

export type FilterChange = {
    value: any;
    operator: string;
};

export type FilterEditorProps = {
    filter: CommonTableV2FilterValue;
    disabled?: boolean;
    onChange: (next: FilterChange) => void;
    filterProps: {
        timezone: string;
        format: string;
        /** what a boolean column calls its two values, when they are not "yes" and "no" */
        trueLabel?: string;
        falseLabel?: string;
        /** put a type-ahead box inside the dropdown; for lists too long to scan */
        searchable?: boolean;
    };
    /** replaces the filter's built-in operator list; see CommonTableV2ColumnSettings.operators */
    operators?: Array<OperatorOption>;
};

export type OperatorOption = {
    name: string;
    /* i18n key suffix under table:table.* */
    label: string;
};

/** Keeps the built-in list when the column names no subset, and never yields an empty menu. */
export const resolveOperators = (
    operators: Array<OperatorOption> | undefined,
    fallback: Array<OperatorOption>,
): Array<OperatorOption> => {
    if (!operators?.length) return fallback;
    const allowed = new Set(operators.map((operator) => operator.name));
    const narrowed = fallback.filter((operator) => allowed.has(operator.name));
    return narrowed.length ? narrowed : operators;
};

export const RANGE_OPERATORS = new Set(['inrange', 'notinrange']);

export const STRING_OPERATORS: OperatorOption[] = [
    { name: 'contains', label: 'contains' },
    { name: 'startsWith', label: 'startsWith' },
    { name: 'endsWith', label: 'endsWith' },
    { name: 'notContains', label: 'notContains' },
    { name: 'eq', label: 'eq' },
    { name: 'neq', label: 'neq' },
    { name: 'empty', label: 'empty' },
    { name: 'notEmpty', label: 'notEmpty' },
];

export const NUMBER_OPERATORS: OperatorOption[] = [
    { name: 'eq', label: 'eq' },
    { name: 'neq', label: 'neq' },
    { name: 'gt', label: 'gt' },
    { name: 'gte', label: 'gte' },
    { name: 'lt', label: 'lt' },
    { name: 'lte', label: 'lte' },
    { name: 'inrange', label: 'inrange' },
    { name: 'notinrange', label: 'notinrange' },
    /* "has no value at all" is not a comparison, but it is the question asked of a numeric
     * column most often, and only this list can offer it */
    { name: 'empty', label: 'empty' },
    { name: 'notEmpty', label: 'notEmpty' },
];

export const DATE_OPERATORS: OperatorOption[] = [
    { name: 'before', label: 'before' },
    { name: 'beforeOrOn', label: 'beforeOrOn' },
    { name: 'afterOrOn', label: 'afterOrOn' },
    { name: 'after', label: 'after' },
    { name: 'eq', label: 'eq' },
    { name: 'neq', label: 'neq' },
    { name: 'inrange', label: 'inrange' },
    { name: 'notinrange', label: 'notinrange' },
];

export const BOOL_OPERATORS: OperatorOption[] = [
    { name: 'eq', label: 'eq' },
    { name: 'neq', label: 'neq' },
];

export const SELECT_OPERATORS: OperatorOption[] = [
    { name: 'inlist', label: 'inlist' },
    { name: 'notinlist', label: 'notinlist' },
];
