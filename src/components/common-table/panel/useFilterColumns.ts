import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
    CommonTableV2ColumnSettings,
    CommonTableV2FilterValue,
    TableField,
} from '../types';
import { isFilterActive } from './filter-value.utils';

/** A column the user is allowed to filter by, with everything the two places
 *  that offer it — the header button and the chip above the table — need to
 *  draw it and to open the same editor.
 */
export type FilterColumn = {
    field: TableField;
    setting: CommonTableV2ColumnSettings;
    filter: CommonTableV2FilterValue;
    /** the column's name in the current language */
    title: string;
    active: boolean;
};

type Params = {
    /** i18n namespace the column labels are read from */
    elementType: string;
    fields: Array<TableField>;
    /** aligned with `fields`, index by index */
    columnSettings: Array<CommonTableV2ColumnSettings>;
    filter?: Array<CommonTableV2FilterValue>;
};

/** The filterable columns, in the order the table shows them.
 *
 *  A column is left out when it has no filter component, when the filter list
 *  carries no entry for it, or when the field opts out with
 *  `filterable: false` — the entry stays in the list either way, because that
 *  list is also the projection the backend selects the columns by.
 */
export const useFilterColumns = ({
    elementType,
    fields,
    columnSettings,
    filter,
}: Params): Array<FilterColumn> => {
    const { t } = useTranslation();

    return useMemo(
        () =>
            fields
                .map((field, idx) => {
                    const setting = columnSettings[idx];
                    const entry = filter?.find((f) => f.name === field.field);
                    if (!setting?.filter || !entry) return undefined;
                    if (field.filterable === false) return undefined;
                    const tag = field.i18nTag ?? field.field;
                    return {
                        field,
                        setting,
                        filter: entry,
                        title: t(`details:${elementType}.fields.${tag}`, tag),
                        active: isFilterActive(entry),
                    };
                })
                .filter(Boolean) as Array<FilterColumn>,
        [fields, columnSettings, filter, elementType, t],
    );
};

/** The same columns, keyed by field name: a header cell asks for its own. */
export const useFilterColumnMap = (
    columns: Array<FilterColumn>,
): Map<string, FilterColumn> =>
    useMemo(() => new Map(columns.map((c) => [c.field.field, c])), [columns]);
