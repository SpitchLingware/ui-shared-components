import {
    BOOL_OPERATORS,
    CommonTableV2FilterValue,
    DATE_OPERATORS,
    NUMBER_OPERATORS,
    OperatorOption,
    RANGE_OPERATORS,
    SELECT_OPERATORS,
    STRING_OPERATORS,
    TableField,
} from '../types';

export const VALUELESS_OPERATORS = new Set(['empty', 'notEmpty']);

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

/** The conditions a column of this kind can be asked.
 *
 *  A column may name its own set through `filterProps.operators`: a filter
 *  component a consumer wrote answers to the operators it was written for,
 *  not to the ones its field type suggests.
 */
export const operatorsForField = (
    field: TableField,
    override?: Array<OperatorOption>,
): Array<OperatorOption> => {
    if (override?.length) return override;
    if (isDateField(field)) return DATE_OPERATORS;
    if (isOptionField(field)) return SELECT_OPERATORS;
    if (field.type === 'number') return NUMBER_OPERATORS;
    if (field.type === 'boolean') return BOOL_OPERATORS;
    return STRING_OPERATORS;
};

/** The value that fits the operator the user has just picked.
 *
 *  A range is stored as two bounds and everything else as one, so the shape
 *  has to follow the operator — an editor handed the other shape draws itself
 *  blank. An operator that carries no value keeps the value it was switched
 *  away from: the field goes out of sight rather than being emptied, and
 *  coming back to it finds the text where it was left.
 */
export const valueForOperator = (value: any, operator: string): any => {
    if (VALUELESS_OPERATORS.has(operator)) return value;
    if (RANGE_OPERATORS.has(operator)) {
        return isRangeValue(value) ? value : { start: '', end: '' };
    }
    return isRangeValue(value) ? '' : value;
};

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

/** A filter read back as two pieces: the question it asks and the answer it
 *  was given.
 *
 *  A chip sets the two in different tones — the operator is what the filter
 *  does, the value is what the user typed — so the summary is handed over
 *  unjoined and the caller decides how to draw it.
 */
export type FilterSummaryParts = {
    operator: string;
    value: string;
};

export const joinSummary = ({ operator, value }: FilterSummaryParts): string =>
    [operator, value].filter(Boolean).join(' ');

const describeList = (values: any[], options: DescribeOptions): string => {
    const { optionLabel = String, maxItems = 3, moreLabel } = options;
    const shown = values.slice(0, maxItems).map((v) => optionLabel(String(v)));
    const rest = values.length - shown.length;
    if (rest <= 0) return shown.join(', ');
    const more = moreLabel ? moreLabel(rest) : `+${rest}`;
    return `${shown.join(', ')}, ${more}`;
};

/** What a filter says, operator apart from value.
 *
 *  Every operator is named, without exception: «Имя: ivan» stood for
 *  `contains`, for `startsWith` and for `eq` alike, and which of the three it
 *  was could only be learnt by opening the editor.
 */
export const describeFilterParts = (
    filter: CommonTableV2FilterValue,
    options: DescribeOptions,
): FilterSummaryParts => {
    const { operatorLabel, boolLabel } = options;
    const operator = operatorLabel(filter.operator);

    if (VALUELESS_OPERATORS.has(filter.operator)) {
        return { operator, value: '' };
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

    if (!text) return { operator: '', value: '' };
    return { operator, value: text };
};

export const describeFilterValue = (
    filter: CommonTableV2FilterValue,
    options: DescribeOptions,
): string => joinSummary(describeFilterParts(filter, options));
