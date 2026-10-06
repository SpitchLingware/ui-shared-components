import { defaultFilterFor } from './common-table.utils';
import { isFilterActive } from './panel/filter-value.utils';
import { CommonTableV2FilterValue, TableField } from './types';

export const hiddenColumnsKey = (storageKey: string) =>
    `${storageKey}.columns.hidden`;

export const parseHiddenColumns = (raw: string | null): Array<string> => {
    if (!raw) return [];
    try {
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];
        return parsed.filter((v): v is string => typeof v === 'string');
    } catch {
        return [];
    }
};

export const readHiddenColumns = (storageKey: string): Array<string> => {
    try {
        return parseHiddenColumns(
            localStorage.getItem(hiddenColumnsKey(storageKey)),
        );
    } catch {
        return [];
    }
};

export const storeHiddenColumns = (
    storageKey: string,
    hidden: Array<string>,
) => {
    try {
        if (hidden.length === 0) {
            localStorage.removeItem(hiddenColumnsKey(storageKey));
        } else {
            localStorage.setItem(
                hiddenColumnsKey(storageKey),
                JSON.stringify(hidden),
            );
        }
    } catch {
        return;
    }
};

export const columnTitleKey = (elementType: string, field: TableField) => {
    const tag = field.i18nTag ?? field.field;
    return { key: `details:${elementType}.fields.${tag}`, fallback: tag };
};

export const hideableFields = (fields: Array<TableField>): Array<TableField> =>
    fields.filter((f) => !f.hidden);

export const effectiveHiddenColumns = (
    stored: Array<string>,
    fields: Array<TableField>,
): Array<string> => {
    const names = hideableFields(fields).map((f) => f.field);
    const hidden = names.filter((name) => stored.includes(name));
    return hidden.length < names.length ? hidden : [];
};

export const toggleHiddenColumn = (
    stored: Array<string>,
    field: string,
    fields: Array<TableField>,
): Array<string> => {
    if (stored.includes(field)) return stored.filter((name) => name !== field);
    const names = hideableFields(fields).map((f) => f.field);
    if (!names.includes(field)) return stored;
    const visible = names.filter(
        (name) => name !== field && !stored.includes(name),
    );
    if (visible.length === 0) return stored;
    return [...stored, field];
};

export const releaseHiddenFilters = (
    hidden: Array<string>,
    fields: Array<TableField>,
    filter: Array<CommonTableV2FilterValue> | undefined,
): Array<CommonTableV2FilterValue> | undefined => {
    const hiddenSet = new Set(hidden);
    const byName = new Map(fields.map((f) => [f.field, f]));
    let changed = false;
    const next = filter?.map((entry) => {
        const field = byName.get(entry.name);
        if (!field || !hiddenSet.has(entry.name) || !isFilterActive(entry)) {
            return entry;
        }
        changed = true;
        return { ...entry, ...defaultFilterFor(field) };
    });
    return changed ? next : undefined;
};
