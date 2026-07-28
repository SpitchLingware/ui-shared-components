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
    };
};

export type OperatorOption = {
    name: string;
    /* i18n key suffix under table:table.* */
    label: string;
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
