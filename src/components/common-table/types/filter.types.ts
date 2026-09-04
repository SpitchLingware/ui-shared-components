import { CommonTableV2FilterValue } from './table-v2.types';

export type FilterChange = {
    value: any;
    operator: string;
};

export type FilterEditorProps = {
    filter: CommonTableV2FilterValue;
    disabled?: boolean;
    /** report every keystroke instead of debouncing: the editor sits in a
     *  popover whose «Применить» may land before the debounce fires */
    immediate?: boolean;
    /** leave the operator out: the popover names the condition above the
     *  value, where it is read without a click, and the editor is left with
     *  the one job of taking the value */
    hideOperator?: boolean;
    onChange: (next: FilterChange) => void;
    filterProps: {
        timezone: string;
        format: string;
        withTime?: boolean;
    };
};

export type OperatorOption = {
    name: string;
    /* i18n key suffix under table:table.* */
    label: string;
};

export const RANGE_OPERATORS = new Set(['inrange', 'notinrange']);

/** Operators a sign states more briefly than a word.
 *
 *  A chip has one line for the column, the operator and the value, and on a
 *  narrow screen the value is the first thing to be cut short — so where the
 *  operator has a sign everybody reads, the sign is what the chip carries.
 */
export const OPERATOR_SYMBOLS: Record<string, string> = {
    eq: '=',
    neq: '≠',
    gt: '>',
    gte: '≥',
    lt: '<',
    lte: '≤',
};

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
