import {
    describeFilterValue,
    DescribeOptions,
    isDateField,
    isFilterActive,
    isOptionField,
    VALUELESS_OPERATORS,
} from './filter-value.utils';
import { periodLabel } from './period.utils';
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

/** What a column's filter currently says, in one line.
 *
 *  The chip above the table and the tooltip of the header button ask the same
 *  question, and a date has to answer it as a period («Сегодня») rather than
 *  as the two bounds stored in the filter.
 */
export const columnSummary = (
    column: FilterColumn,
    options: ColumnSummaryOptions,
): string => {
    const { field, setting, filter } = column;

    if (!isFilterActive(filter)) return '';

    if (isDateField(field)) {
        return periodLabel(filter, {
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
        return options.countLabel(values.length);
    }

    return describeFilterValue(filter, options);
};
