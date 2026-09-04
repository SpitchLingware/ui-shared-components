import {
    describeFilterParts,
    DescribeOptions,
    FilterSummaryParts,
    isDateField,
    isFilterActive,
    isOptionField,
    joinSummary,
    VALUELESS_OPERATORS,
} from './filter-value.utils';
import { periodParts } from './period.utils';
import { FilterColumn } from './useFilterColumns';

export type ColumnSummaryOptions = DescribeOptions & {
    /** stands in for `optionLabel` where the ids cannot be resolved: a header
     *  tooltip must not pull every column's option source just to be drawn,
     *  so a list of picks is summed up as «3 выбрано» there */
    countLabel?: (count: number) => string;
    /** the language a period is spelled in */
    locale?: string;
    /** short form for the narrow layout */
    compact?: boolean;
};

const NOTHING: FilterSummaryParts = { operator: '', value: '' };

/** What a column's filter currently says, as the operator and the value it
 *  was given.
 *
 *  The chip above the table and the tooltip of the header button ask the same
 *  question, and a date has to answer it as a period («Сегодня») rather than
 *  as the two bounds stored in the filter.
 */
export const columnSummaryParts = (
    column: FilterColumn,
    options: ColumnSummaryOptions,
): FilterSummaryParts => {
    const { field, setting, filter } = column;

    if (!isFilterActive(filter)) return NOTHING;

    if (isDateField(field)) {
        return periodParts(filter, {
            format: setting.filterProps?.format ?? 'YYYY-MM-DD',
            timezone: setting.filterProps?.timezone ?? 'UTC',
            locale: options.locale,
            compact: options.compact,
            operatorLabel: options.operatorLabel,
            emptyLabel: '',
        });
    }

    if (
        isOptionField(field) &&
        !options.optionLabel &&
        options.countLabel &&
        !VALUELESS_OPERATORS.has(filter.operator)
    ) {
        const values = Array.isArray(filter.value)
            ? filter.value
            : [filter.value];
        return {
            operator: options.operatorLabel(filter.operator),
            value: options.countLabel(values.length),
        };
    }

    return describeFilterParts(filter, options);
};

/** The same summary in one line, for a tooltip or an aria label. */
export const columnSummary = (
    column: FilterColumn,
    options: ColumnSummaryOptions,
): string => joinSummary(columnSummaryParts(column, options));
