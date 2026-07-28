import { describe, it, expect } from 'vitest';
import { getDefaultFilterValues } from '../common-table.utils';
import type { TableField } from '../types/table-v2.fields';

describe('getDefaultFilterValues(fields, values)', () => {
    const createField = (type: any, fieldName: string): TableField => ({
        field: fieldName,
        type,
    });

    describe('date fields', () => {
        it('should return inrange operator for date type', () => {
            const fields = [createField('date', 'createdAt')];
            const result = getDefaultFilterValues(fields, {});
            expect(result[0].operator).toBe('inrange');
            expect(result[0].type).toBe('date');
            expect(result[0].name).toBe('createdAt');
        });

        it('should use provided value for date field', () => {
            const fields = [createField('date', 'updatedAt')];
            const result = getDefaultFilterValues(fields, {
                updatedAt: '2024-01-01',
            });
            expect(result[0].value).toBe('2024-01-01');
        });

        it('should default to empty string if no value provided', () => {
            const fields = [createField('date', 'deletedAt')];
            const result = getDefaultFilterValues(fields, {});
            expect(result[0].value).toBe('');
        });
    });

    describe('number fields', () => {
        it('should return gte operator for number type', () => {
            const fields = [createField('number', 'age')];
            const result = getDefaultFilterValues(fields, {});
            expect(result[0].operator).toBe('gte');
            expect(result[0].type).toBe('number');
        });

        it('should use provided value for number field', () => {
            const fields = [createField('number', 'score')];
            const result = getDefaultFilterValues(fields, { score: '100' });
            expect(result[0].value).toBe('100');
        });
    });

    describe('text fields (general)', () => {
        it('should return startsWith operator for text type', () => {
            const fields = [createField('text', 'name')];
            const result = getDefaultFilterValues(fields, {});
            expect(result[0].operator).toBe('startsWith');
            expect(result[0].type).toBe('string');
        });

        it('should return eq operator for _id text field (special case)', () => {
            const fields = [createField('text', '_id')];
            const result = getDefaultFilterValues(fields, {});
            expect(result[0].operator).toBe('eq');
            expect(result[0].type).toBe('string');
        });
    });

    describe('select fields', () => {
        it('should return inlist operator for select type', () => {
            const fields = [createField('select', 'status')];
            const result = getDefaultFilterValues(fields, {});
            expect(result[0].operator).toBe('inlist');
            expect(result[0].type).toBe('select');
        });

        it('should handle select with options', () => {
            const field: TableField = {
                field: 'priority',
                type: 'select',
                title: 'Priority',
                options: { low: 'Low', high: 'High' },
            };
            const result = getDefaultFilterValues([field], {});
            expect(result[0].operator).toBe('inlist');
        });
    });

    describe('boolean fields', () => {
        it('should return eq operator for boolean type', () => {
            const fields = [createField('boolean', 'isActive')];
            const result = getDefaultFilterValues(fields, {});
            expect(result[0].operator).toBe('eq');
            expect(result[0].type).toBe('boolean');
        });

        it('should handle boolean field with value', () => {
            const fields = [createField('boolean', 'deleted')];
            const result = getDefaultFilterValues(fields, { deleted: 'true' });
            expect(result[0].value).toBe('true');
        });
    });

    describe('object fields', () => {
        it('should return inlist operator for object type', () => {
            const field: TableField = {
                field: 'address',
                type: 'object',
                path: '$.city',
                key: 'name',
                predicates: [],
            };
            const result = getDefaultFilterValues([field], {});
            expect(result[0].operator).toBe('inlist');
        });

        it('should include path and key from field definition', () => {
            const field: TableField = {
                field: 'contact',
                type: 'object',
                path: '$.email',
                key: 'value',
                predicates: [],
            };
            const result = getDefaultFilterValues([field], {});
            expect((result[0] as any).path).toBe('$.email');
            expect((result[0] as any).key).toBe('value');
        });

        it('should include predicates if provided', () => {
            const field: TableField = {
                field: 'metadata',
                type: 'object',
                path: '$.tags',
                key: 'name',
                predicates: [{ field: 'color', value: 'red' }],
            };
            const result = getDefaultFilterValues([field], {});
            expect((result[0] as any).predicates).toEqual([
                { field: 'color', value: 'red' },
            ]);
        });
    });

    describe('extra fields', () => {
        it('should return inlist operator for extra type', () => {
            const field: TableField = {
                field: 'custom',
                type: 'extra',
                selectType: 'dropdown',
            };
            const result = getDefaultFilterValues([field], {});
            expect(result[0].operator).toBe('inlist');
        });

        it('should handle extra with custom selectType', () => {
            const field: TableField = {
                field: 'tag',
                type: 'extra',
                selectType: 'multi-select',
            };
            const result = getDefaultFilterValues([field], {});
            expect(result[0].type).toBe('select');
        });
    });

    describe('extension fields', () => {
        it('should return eq operator for extension type', () => {
            const field: TableField = {
                field: 'attachment',
                type: 'extension',
            };
            const result = getDefaultFilterValues([field], {});
            expect(result[0].operator).toBe('eq');
            expect(result[0].type).toBe('extension');
        });
    });

    describe('multiple fields combined', () => {
        it('should handle mixed field types correctly', () => {
            const fields: TableField[] = [
                createField('text', 'name'),
                createField('number', 'age'),
                createField('boolean', 'active'),
                createField('date', 'createdAt'),
            ];

            const result = getDefaultFilterValues(fields, {});

            expect(result[0].operator).toBe('startsWith'); // text name
            expect(result[1].operator).toBe('gte'); // number age
            expect(result[2].operator).toBe('eq'); // boolean active
            expect(result[3].operator).toBe('inrange'); // date createdAt
        });

        it('should preserve field order in result', () => {
            const fields: TableField[] = [
                createField('text', 'firstName'),
                createField('text', 'lastName'),
            ];

            const result = getDefaultFilterValues(fields, {});
            expect(result[0].name).toBe('firstName');
            expect(result[1].name).toBe('lastName');
        });

        it('should use values from provided record', () => {
            const fields: TableField[] = [
                createField('text', 'name'),
                createField('number', 'age'),
            ];

            const result = getDefaultFilterValues(fields, {
                name: 'John',
                age: '30',
            });
            expect(result[0].value).toBe('John');
            expect(result[1].value).toBe('30');
        });
    });

    describe('edge cases', () => {
        it('should handle empty fields array', () => {
            const result = getDefaultFilterValues([], {});
            expect(result).toEqual([]);
        });

        it('should handle empty values record', () => {
            const fields = [createField('text', 'name')];
            const result = getDefaultFilterValues(fields, {});
            expect(result[0].value).toBe('');
        });

        it('should use fallback eq operator for unknown field types', () => {
            const field: TableField = {
                field: 'unknown',
                type: 'unknown' as any, // force unknown type
            };
            const result = getDefaultFilterValues([field], {});
            expect(result[0].operator).toBe('eq');
        });

        it('should handle missing values in record', () => {
            const fields = [createField('text', 'name')];
            const result = getDefaultFilterValues(fields, { other: 'value' });
            expect(result[0].value).toBe(''); // fallback to empty string
        });
    });
});
