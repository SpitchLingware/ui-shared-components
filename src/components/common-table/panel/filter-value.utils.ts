import { CommonTableV2FilterValue, TableField } from '../types';

export const VALUELESS_OPERATORS = new Set(['empty', 'notEmpty']);

/* operators whose name has to be spelled out on the chip: without it
   «Дата: 2026-08-14» reads the same for «раньше» and «после» */
const IMPLICIT_OPERATORS = new Set([
    'eq',
    'inlist',
    'inrange',
    'contains',
    'startsWith',
]);

export type RangeValue = { start?: any; end?: any };

export const isRangeValue = (value: any): value is RangeValue =>
    Boolean(value) &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    ('start' in value || 'end' in value);

const hasScalar = (value: any): boolean =>
    value !== undefined && value !== null && value !== '';

export const hasFilterValue = (value: any): boolean => {
    if (Array.isArray(value)) return value.length > 0;
    if (isRangeValue(value)) {
        return hasScalar(value.start) || hasScalar(value.end);
    }
    return hasScalar(value);
};

export const isFilterActive = (
    filter: CommonTableV2FilterValue | undefined,
): boolean => {
    if (!filter) return false;
    if (VALUELESS_OPERATORS.has(filter.operator)) return true;
    return hasFilterValue(filter.value);
};

/** An emptied value of the same shape.
 *
 *  The filter list doubles as the projection the backend selects by, so an
 *  entry is emptied, never dropped — dropping it takes the column out of the
 *  response.
 */
export const emptyValueFor = (value: any): any => {
    if (Array.isArray(value)) return [];
    if (isRangeValue(value)) return { start: '', end: '' };
    return '';
};

export const clearFilter = (
    filter: CommonTableV2FilterValue,
): CommonTableV2FilterValue => ({
    ...filter,
    value: emptyValueFor(filter.value),
});

export const clearFilters = (
    filter: Array<CommonTableV2FilterValue> | undefined,
): Array<CommonTableV2FilterValue> => (filter ?? []).map(clearFilter);

export const isDateField = (field: TableField): boolean =>
    field.type === 'date';

export const isOptionField = (field: TableField): boolean =>
    field.type === 'select' ||
    field.type === 'entity' ||
    field.type === 'extra' ||
    (field.type === 'object' && Boolean(field.selectType));

export type DescribeOptions = {
    /** translates an operator name into the current language */
    operatorLabel: (operator: string) => string;
    /** turns a stored id into what the user picked in the list */
    optionLabel?: (id: string) => string;
    /** translates a boolean into «Да» / «Нет» */
    boolLabel?: (value: boolean) => string;
    /** how many list items fit on a chip before it collapses into «+N» */
    maxItems?: number;
    moreLabel?: (count: number) => string;
};

const describeList = (values: any[], options: DescribeOptions): string => {
    const { optionLabel = String, maxItems = 3, moreLabel } = options;
    const shown = values.slice(0, maxItems).map((v) => optionLabel(String(v)));
    const rest = values.length - shown.length;
    if (rest <= 0) return shown.join(', ');
    const more = moreLabel ? moreLabel(rest) : `+${rest}`;
    return `${shown.join(', ')}, ${more}`;
};

export const describeFilterValue = (
    filter: CommonTableV2FilterValue,
    options: DescribeOptions,
): string => {
    const { operatorLabel, boolLabel } = options;

    if (VALUELESS_OPERATORS.has(filter.operator)) {
        return operatorLabel(filter.operator);
    }

    const { value } = filter;
    let text: string;

    if (Array.isArray(value)) {
        text = describeList(value, options);
    } else if (isRangeValue(value)) {
        const start = hasScalar(value.start) ? String(value.start) : '';
        const end = hasScalar(value.end) ? String(value.end) : '';
        text = start && end ? `${start} — ${end}` : start || end;
    } else if (typeof value === 'boolean') {
        text = boolLabel ? boolLabel(value) : String(value);
    } else {
        text = String(value ?? '');
    }

    if (!text) return '';
    if (IMPLICIT_OPERATORS.has(filter.operator)) return text;
    return `${operatorLabel(filter.operator)} ${text}`;
};
