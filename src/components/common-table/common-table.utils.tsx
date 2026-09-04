import { CommonTableV2FilterValue, TableField } from './types';

const defaultFilterByType = (
    field: TableField,
    value: any = '',
): CommonTableV2FilterValue => {
    switch (field.type) {
        case 'date':
            return {
                name: field.field,
                operator: 'inrange',
                type: 'date',
                value: value,
            };
        case 'number':
            return {
                name: field.field,
                operator: 'gte',
                type: 'number',
                value: value,
            };
        case 'text':
            if (field.field === '_id') {
                return {
                    name: field.field,
                    operator: 'eq',
                    type: 'string',
                    value: value,
                };
            }
            return {
                name: field.field,
                operator: 'startsWith',
                type: 'string',
                value: value,
            };
        case 'select':
            return {
                name: field.field,
                operator: 'inlist',
                type: 'select',
                value: value,
            };
        case 'boolean':
            return {
                name: field.field,
                operator: 'eq',
                type: 'boolean',
                value: value,
            };
        case 'object': {
            return {
                name: field.field,
                operator: 'inlist',
                type: 'select',
                value: value,
                predicates: field.predicates,
                path: field.path,
                key: field.key,
            } as CommonTableV2FilterValue;
        }
        case 'extra': {
            return {
                name: field.field,
                operator: 'inlist',
                type: 'select',
                value: value,
            };
        }
        case 'extension': {
            return {
                name: field.field,
                operator: 'eq',
                type: 'extension',
                value: value,
            };
        }
        default:
            return {
                name: field.field,
                operator: 'eq',
                type: 'string',
                value: value,
            };
    }
};

/** The untouched filter entry for a column: the operator the column starts
 *  with and an empty value. Also what «Сбросить» puts a column back to.
 */
export const defaultFilterFor = (
    field: TableField,
    value: any = '',
): CommonTableV2FilterValue => {
    const entry = defaultFilterByType(field, value);
    return field.operator ? { ...entry, operator: field.operator } : entry;
};

export const getDefaultFilterValues = (
    fields: Array<TableField>,
    values: Record<string, string>,
): Array<CommonTableV2FilterValue> =>
    fields.map((field: TableField) =>
        defaultFilterFor(
            field,
            /* a column the panel does not show has no way back to empty, so a
               value restored from storage would filter the table invisibly —
               that happens the moment a column stops being filterable */
            field.filterable === false ? '' : (values[field.field] ?? ''),
        ),
    );
