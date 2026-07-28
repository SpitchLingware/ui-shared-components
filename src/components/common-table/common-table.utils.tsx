import { CommonTableV2FilterValue, TableField } from './types';

export const getDefaultFilterValues = (
    fields: Array<TableField>,
    values: Record<string, string>,
): Array<CommonTableV2FilterValue> => {
    return fields.map((field: TableField) => {
        const value = values[field.field] ?? '';
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
                };
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
    });
};
