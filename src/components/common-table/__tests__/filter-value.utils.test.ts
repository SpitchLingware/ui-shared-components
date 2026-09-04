import { describe, expect, it } from 'vitest';
import {
    defaultFilterFor,
    getDefaultFilterValues,
} from '../common-table.utils';
import {
    clearFilters,
    describeFilterParts,
    describeFilterValue,
    emptyValueFor,
    isFilterActive,
    operatorsForField,
    valueForOperator,
} from '../panel/filter-value.utils';
import {
    CommonTableV2FilterValue,
    DATE_OPERATORS,
    NUMBER_OPERATORS,
    SELECT_OPERATORS,
    STRING_OPERATORS,
    TableField,
} from '../types';

const entry = (
    over: Partial<CommonTableV2FilterValue>,
): CommonTableV2FilterValue => ({
    name: 'channel',
    type: 'select',
    operator: 'inlist',
    value: '',
    ...over,
});

const operatorLabel = (op: string) => `op:${op}`;

describe('telling an applied filter from an untouched one', () => {
    it('an empty value of any shape is not a filter', () => {
        expect(isFilterActive(entry({ value: '' }))).toBe(false);
        expect(isFilterActive(entry({ value: [] }))).toBe(false);
        expect(isFilterActive(entry({ value: { start: '', end: '' } }))).toBe(
            false,
        );
        expect(isFilterActive(undefined)).toBe(false);
    });

    it('«нет» is a value — false must not read as empty', () => {
        expect(isFilterActive(entry({ type: 'boolean', value: false }))).toBe(
            true,
        );
        expect(isFilterActive(entry({ type: 'number', value: 0 }))).toBe(true);
    });

    it('one filled bound is enough for a range', () => {
        expect(
            isFilterActive(entry({ value: { start: '2026-07-15', end: '' } })),
        ).toBe(true);
    });

    it('«пусто» filters without carrying a value', () => {
        expect(isFilterActive(entry({ operator: 'empty', value: '' }))).toBe(
            true,
        );
    });
});

describe('clearing a filter', () => {
    /* the list of filters is also the projection the backend selects the
       columns by, so an entry may be emptied but never dropped */
    it('keeps every entry and its shape', () => {
        const before = [
            entry({ name: 'channel', value: ['vk'] }),
            entry({ name: 'uuid', type: 'string', value: 'abc' }),
            entry({
                name: 'start_time',
                type: 'date',
                operator: 'inrange',
                value: { start: '2026-07-15', end: '2026-07-16' },
            }),
        ];
        const after = clearFilters(before);

        expect(after.map((f) => f.name)).toEqual(before.map((f) => f.name));
        expect(after.every((f) => !isFilterActive(f))).toBe(true);
        expect(after[0].value).toEqual([]);
        expect(after[2].value).toEqual({ start: '', end: '' });
    });

    it('an empty list stays an empty list', () => {
        expect(clearFilters(undefined)).toEqual([]);
        expect(emptyValueFor(undefined)).toBe('');
    });
});

describe('the default a column is reset to', () => {
    const field = (over: any): TableField => ({ field: 'x', ...over });

    it('is the operator the column started with', () => {
        expect(defaultFilterFor(field({ type: 'date' })).operator).toBe(
            'inrange',
        );
        expect(defaultFilterFor(field({ type: 'number' })).operator).toBe(
            'gte',
        );
        expect(defaultFilterFor(field({ type: 'select' })).operator).toBe(
            'inlist',
        );
        expect(defaultFilterFor(field({ type: 'text' })).operator).toBe(
            'startsWith',
        );
    });

    it('_id is looked up whole, not by prefix', () => {
        expect(defaultFilterFor({ field: '_id', type: 'text' }).operator).toBe(
            'eq',
        );
    });

    it('the column may name the operator its type would not have picked', () => {
        /* a phone number or an e-mail is searched for by a fragment, and
           «starts with» — the default for text — answers nothing */
        expect(
            defaultFilterFor({
                field: 'user_data.id',
                type: 'text',
                operator: 'contains',
            }).operator,
        ).toBe('contains');

        /* and it still overrides the special case for _id */
        expect(
            defaultFilterFor({
                field: '_id',
                type: 'text',
                operator: 'contains',
            }).operator,
        ).toBe('contains');
    });

    it('carries the object column its path back', () => {
        const resolved: any = defaultFilterFor({
            field: 'skills',
            type: 'object',
            path: 'skills',
            key: 'name',
            predicates: [{ field: 'id', value: 'x' }],
        });
        expect(resolved.path).toBe('skills');
        expect(resolved.key).toBe('name');
        expect(resolved.predicates).toHaveLength(1);
    });
});

describe('a column the panel does not offer', () => {
    const fields: Array<TableField> = [
        { field: 'create_date', type: 'date' },
        { field: 'number', type: 'text', operator: 'contains' },
        { field: 'direction', type: 'text', filterable: false },
    ];

    it('still travels in the filter list — it is the projection', () => {
        const values = getDefaultFilterValues(fields, {});
        expect(values.map((f) => f.name)).toEqual([
            'create_date',
            'number',
            'direction',
        ]);
    });

    it('drops a value restored from storage instead of filtering blind', () => {
        /* the value was stored while the column was still filterable; with no
           chip to clear it the table would come back filtered by something the
           operator cannot see */
        const values = getDefaultFilterValues(fields, {
            number: '7700',
            direction: 'in',
        });
        expect(values[1].value).toBe('7700');
        expect(values[2].value).toBe('');
    });

    it('keeps the operator the column asked for', () => {
        expect(getDefaultFilterValues(fields, {})[1].operator).toBe('contains');
    });
});

describe('what the chip says', () => {
    it('spells a list out through the labels it was picked by', () => {
        const text = describeFilterValue(entry({ value: ['vk', 'max'] }), {
            operatorLabel,
            optionLabel: (id) => id.toUpperCase(),
        });
        expect(text).toBe('op:inlist VK, MAX');
    });

    it('collapses a long list', () => {
        const text = describeFilterValue(
            entry({ value: ['a', 'b', 'c', 'd', 'e'] }),
            {
                operatorLabel,
                maxItems: 3,
                moreLabel: (count) => `ещё ${count}`,
            },
        );
        expect(text).toBe('op:inlist a, b, c, ещё 2');
    });

    /* «Имя: ivan» stood for `contains`, for `startsWith` and for `eq` alike,
       and which of the three it was could only be learnt by opening the
       editor — so the operator is named whatever it is */
    it('names the operator, whichever one it is', () => {
        expect(
            describeFilterValue(
                entry({
                    type: 'date',
                    operator: 'before',
                    value: '2026-07-15',
                }),
                { operatorLabel },
            ),
        ).toBe('op:before 2026-07-15');

        expect(
            describeFilterValue(
                entry({
                    type: 'date',
                    operator: 'inrange',
                    value: { start: '2026-07-15', end: '2026-07-16' },
                }),
                { operatorLabel },
            ),
        ).toBe('op:inrange 2026-07-15 — 2026-07-16');

        expect(
            describeFilterValue(
                entry({ type: 'string', operator: 'contains', value: 'ivan' }),
                { operatorLabel },
            ),
        ).toBe('op:contains ivan');
    });

    it('a valueless operator is the whole message', () => {
        expect(
            describeFilterValue(entry({ operator: 'empty', value: '' }), {
                operatorLabel,
            }),
        ).toBe('op:empty');
    });

    it('reads a boolean in words', () => {
        expect(
            describeFilterValue(
                entry({ type: 'boolean', operator: 'eq', value: false }),
                { operatorLabel, boolLabel: (v) => (v ? 'Да' : 'Нет') },
            ),
        ).toBe('op:eq Нет');
    });

    it('hands the operator over apart from the value', () => {
        expect(
            describeFilterParts(
                entry({ type: 'string', operator: 'startsWith', value: 'iv' }),
                { operatorLabel },
            ),
        ).toEqual({ operator: 'op:startsWith', value: 'iv' });
    });

    it('says nothing at all about an empty value', () => {
        expect(
            describeFilterParts(
                entry({ type: 'string', operator: 'contains', value: '' }),
                { operatorLabel },
            ),
        ).toEqual({ operator: '', value: '' });
    });
});

describe('the conditions a column can be asked', () => {
    it('come from the kind of value the column holds', () => {
        expect(operatorsForField({ field: 'name', type: 'text' })).toBe(
            STRING_OPERATORS,
        );
        expect(operatorsForField({ field: 'size', type: 'number' })).toBe(
            NUMBER_OPERATORS,
        );
        expect(operatorsForField({ field: 'start_time', type: 'date' })).toBe(
            DATE_OPERATORS,
        );
        expect(
            operatorsForField({
                field: 'channel',
                type: 'select',
                title: '',
                options: {},
            }),
        ).toBe(SELECT_OPERATORS);
    });

    it('a column may name its own set', () => {
        const own = [{ name: 'like', label: 'like' }];
        expect(operatorsForField({ field: 'name', type: 'text' }, own)).toBe(
            own,
        );
        /* an empty list is not a set of its own, it is the absence of one */
        expect(operatorsForField({ field: 'name', type: 'text' }, [])).toBe(
            STRING_OPERATORS,
        );
    });
});

describe('the value that fits the operator just picked', () => {
    it('grows a second bound on the way into a range', () => {
        expect(valueForOperator('7', 'inrange')).toEqual({
            start: '',
            end: '',
        });
        /* one range operator to the other keeps the window as it stands */
        const window = { start: '1', end: '5' };
        expect(valueForOperator(window, 'notinrange')).toBe(window);
    });

    it('drops the window on the way out of one', () => {
        expect(valueForOperator({ start: '1', end: '5' }, 'eq')).toBe('');
    });

    it('leaves a list and a scalar as they are', () => {
        const list = ['vk', 'max'];
        expect(valueForOperator(list, 'notinlist')).toBe(list);
        expect(valueForOperator('ivan', 'startsWith')).toBe('ivan');
    });

    it('a valueless operator keeps what it was switched away from', () => {
        /* the field goes out of sight rather than being emptied, so coming
           back to «содержит» finds the text where it was left */
        expect(valueForOperator('ivan', 'empty')).toBe('ivan');
    });
});
