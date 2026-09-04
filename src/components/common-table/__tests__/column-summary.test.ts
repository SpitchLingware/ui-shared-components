import { describe, expect, it } from 'vitest';
import { columnSummary, columnSummaryParts } from '../panel/column-summary';
import { FilterColumn } from '../panel/useFilterColumns';
import { isFilterActive } from '../panel/filter-value.utils';
import {
    CommonTableV2FilterValue,
    CommonTableV2ColumnSettings,
    TableField,
} from '../types';

const FORMAT = 'YYYY-MM-DD';
const TZ = 'Europe/Moscow';

const operatorLabel = (op: string) => `op:${op}`;
const countLabel = (count: number) => `${count} выбрано`;

const column = (
    field: TableField,
    value: any,
    operator: string,
    filterProps: any = { format: FORMAT, timezone: TZ },
): FilterColumn => {
    const filter: CommonTableV2FilterValue = {
        name: field.field,
        type: field.type === 'text' ? 'string' : field.type,
        operator,
        value,
    };
    return {
        field,
        setting: {
            filter: (() => null) as any,
            filterProps,
        } as CommonTableV2ColumnSettings,
        filter,
        title: field.field,
        active: isFilterActive(filter),
    };
};

describe('what a column says its filter is set to', () => {
    it('an untouched column says nothing at all', () => {
        const c = column({ field: 'name', type: 'text' }, '', 'startsWith');
        expect(columnSummary(c, { operatorLabel })).toBe('');
    });

    it('a date is a period, not the two bounds it is stored as', () => {
        const c = column(
            { field: 'start_time', type: 'date' },
            { start: '2026-08-01', end: '2026-08-14' },
            'inrange',
        );
        /* the bounds are spelled out as days, and the year is said once */
        expect(columnSummary(c, { operatorLabel, locale: 'en' })).toBe(
            'op:inrange 1 Aug — 14 Aug 2026',
        );
    });

    it('a period reads short where the layout is narrow', () => {
        const c = column(
            { field: 'start_time', type: 'date' },
            { start: '2026-08-01', end: '2026-08-14' },
            'inrange',
        );
        expect(
            columnSummary(c, { operatorLabel, locale: 'en', compact: true }),
        ).toBe('op:inrange 01.08 — 14.08');
    });

    it('picked options are counted where their labels cannot be read', () => {
        const c = column(
            { field: 'channel', type: 'select', title: '', options: {} },
            ['a', 'b', 'c'],
            'inlist',
        );
        expect(columnSummary(c, { operatorLabel, countLabel })).toBe(
            'op:inlist 3 выбрано',
        );
    });

    it('and are named where they can — the count is only a stand-in', () => {
        const c = column(
            { field: 'channel', type: 'select', title: '', options: {} },
            ['a', 'b'],
            'inlist',
        );
        expect(
            columnSummary(c, {
                operatorLabel,
                countLabel,
                optionLabel: (id) => id.toUpperCase(),
            }),
        ).toBe('op:inlist A, B');
    });

    it('an operator that needs no value is named even so', () => {
        const c = column(
            { field: 'channel', type: 'select', title: '', options: {} },
            '',
            'empty',
        );
        expect(columnSummary(c, { operatorLabel, countLabel })).toBe(
            'op:empty',
        );
    });

    it('a plain value always carries its operator', () => {
        /* the three of them read the same without it, and the chip is the one
           place the user is told which question the table is answering */
        ['contains', 'startsWith', 'eq'].forEach((op) => {
            const c = column({ field: 'name', type: 'text' }, 'ivan', op);
            expect(columnSummary(c, { operatorLabel })).toBe(`op:${op} ivan`);
        });
    });

    it('hands the two halves over apart, for a chip to tone them', () => {
        const c = column({ field: 'name', type: 'text' }, 'ivan', 'startsWith');
        expect(columnSummaryParts(c, { operatorLabel })).toEqual({
            operator: 'op:startsWith',
            value: 'ivan',
        });
    });

    it('an untouched column has neither half', () => {
        const c = column({ field: 'name', type: 'text' }, '', 'contains');
        expect(columnSummaryParts(c, { operatorLabel })).toEqual({
            operator: '',
            value: '',
        });
    });
});
