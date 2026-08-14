import { CommonTableV2FilterValue, TableField } from './types';

/** The untouched filter entry for a column: the operator the column starts
 *  with and an empty value. Also what «Сбросить» puts a column back to.
 */
export const defaultFilterFor = (
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

export const getDefaultFilterValues = (
    fields: Array<TableField>,
    values: Record<string, string>,
): Array<CommonTableV2FilterValue> =>
    fields.map((field: TableField) =>
        defaultFilterFor(field, values[field.field] ?? ''),
    );
