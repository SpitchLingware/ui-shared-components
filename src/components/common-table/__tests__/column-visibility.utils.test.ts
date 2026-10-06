import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
    columnTitleKey,
    effectiveHiddenColumns,
    hiddenColumnsKey,
    hideableFields,
    parseHiddenColumns,
    readHiddenColumns,
    releaseHiddenFilters,
    storeHiddenColumns,
    toggleHiddenColumn,
} from '../column-visibility.utils';
import { CommonTableV2FilterValue, TableField } from '../types';

const fields: Array<TableField> = [
    { field: '_id', type: 'text', hidden: true },
    { field: 'login', type: 'text' },
    { field: 'action', type: 'text' },
    { field: 'create_date', type: 'date' },
];

const memoryStorage = () => {
    const data = new Map<string, string>();
    return {
        getItem: (k: string) => (data.has(k) ? data.get(k)! : null),
        setItem: (k: string, v: string) => void data.set(k, v),
        removeItem: (k: string) => void data.delete(k),
        data,
    };
};

describe('parseHiddenColumns', () => {
    it('reads a stored list of names', () => {
        expect(parseHiddenColumns('["login","action"]')).toEqual([
            'login',
            'action',
        ]);
    });

    it('answers an empty list for nothing, garbage and the wrong shape', () => {
        expect(parseHiddenColumns(null)).toEqual([]);
        expect(parseHiddenColumns('')).toEqual([]);
        expect(parseHiddenColumns('{not json')).toEqual([]);
        expect(parseHiddenColumns('{"login":true}')).toEqual([]);
        expect(parseHiddenColumns('"login"')).toEqual([]);
    });

    it('drops entries that are not names', () => {
        expect(parseHiddenColumns('["login",1,null,{"a":1}]')).toEqual([
            'login',
        ]);
    });
});

describe('stored hidden columns', () => {
    let storage: ReturnType<typeof memoryStorage>;

    beforeEach(() => {
        storage = memoryStorage();
        vi.stubGlobal('localStorage', storage);
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('lives next to the column widths under the table storage key', () => {
        expect(hiddenColumnsKey('audit')).toBe('audit.columns.hidden');
    });

    it('round-trips through localStorage', () => {
        storeHiddenColumns('audit', ['login']);
        expect(storage.data.get('audit.columns.hidden')).toBe('["login"]');
        expect(readHiddenColumns('audit')).toEqual(['login']);
    });

    it('removes the entry once nothing is hidden', () => {
        storeHiddenColumns('audit', ['login']);
        storeHiddenColumns('audit', []);
        expect(storage.data.has('audit.columns.hidden')).toBe(false);
        expect(readHiddenColumns('audit')).toEqual([]);
    });

    it('survives a storage that throws', () => {
        const blocked = () => {
            throw new Error('blocked');
        };
        vi.stubGlobal('localStorage', {
            getItem: blocked,
            setItem: blocked,
            removeItem: blocked,
        });
        expect(readHiddenColumns('audit')).toEqual([]);
        expect(() => storeHiddenColumns('audit', ['login'])).not.toThrow();
    });
});

describe('columnTitleKey', () => {
    it('names the column the way its header does', () => {
        expect(
            columnTitleKey('audit', { field: 'login', type: 'text' }),
        ).toEqual({ key: 'details:audit.fields.login', fallback: 'login' });
        expect(
            columnTitleKey('audit', {
                field: 'context.x',
                type: 'text',
                i18nTag: 'x',
            }),
        ).toEqual({ key: 'details:audit.fields.x', fallback: 'x' });
    });
});

describe('hideableFields', () => {
    it('never offers a column the configuration keeps hidden', () => {
        expect(hideableFields(fields).map((f) => f.field)).toEqual([
            'login',
            'action',
            'create_date',
        ]);
    });
});

describe('effectiveHiddenColumns', () => {
    it('keeps only names of columns the table can show, in table order', () => {
        expect(
            effectiveHiddenColumns(
                ['create_date', 'gone', '_id', 'login'],
                fields,
            ),
        ).toEqual(['login', 'create_date']);
    });

    it('shows everything when the stored list would hide every column', () => {
        expect(
            effectiveHiddenColumns(['login', 'action', 'create_date'], fields),
        ).toEqual([]);
    });

    it('lets a column added later appear on its own', () => {
        const more: Array<TableField> = [
            ...fields,
            { field: 'action_description', type: 'action' },
        ];
        expect(effectiveHiddenColumns(['login'], more)).toEqual(['login']);
    });
});

describe('toggleHiddenColumn', () => {
    it('hides a shown column and shows a hidden one', () => {
        const hidden = toggleHiddenColumn([], 'login', fields);
        expect(hidden).toEqual(['login']);
        expect(toggleHiddenColumn(hidden, 'login', fields)).toEqual([]);
    });

    it('refuses to hide the last shown column', () => {
        const stored = ['login', 'action'];
        expect(toggleHiddenColumn(stored, 'create_date', fields)).toBe(stored);
    });

    it('ignores a column the menu does not offer', () => {
        const stored: Array<string> = [];
        expect(toggleHiddenColumn(stored, '_id', fields)).toBe(stored);
        expect(toggleHiddenColumn(stored, 'unknown', fields)).toBe(stored);
    });

    it('keeps stored names of columns the table does not have right now', () => {
        expect(toggleHiddenColumn(['gone'], 'login', fields)).toEqual([
            'gone',
            'login',
        ]);
    });
});

describe('releaseHiddenFilters', () => {
    const filter: Array<CommonTableV2FilterValue> = [
        { name: 'login', type: 'string', operator: 'contains', value: 'ivan' },
        { name: 'action', type: 'string', operator: 'contains', value: '' },
        {
            name: 'create_date',
            type: 'date',
            operator: 'inrange',
            value: ['2026-10-01', '2026-10-06'],
        },
    ];

    it('puts the filter of a hidden column back to its default, and only that one', () => {
        const next = releaseHiddenFilters(['login'], fields, filter);
        expect(next?.[0]).toEqual({
            name: 'login',
            type: 'string',
            operator: 'startsWith',
            value: '',
        });
        expect(next?.[1]).toBe(filter[1]);
        expect(next?.[2]).toBe(filter[2]);
    });

    it('keeps every entry, so the projection still asks for the column', () => {
        expect(
            releaseHiddenFilters(['login'], fields, filter)?.map((f) => f.name),
        ).toEqual(['login', 'action', 'create_date']);
    });

    it('reports no change when a hidden column has no active filter', () => {
        expect(
            releaseHiddenFilters(['action'], fields, filter),
        ).toBeUndefined();
        expect(
            releaseHiddenFilters(['login'], fields, undefined),
        ).toBeUndefined();
    });

    it('is settled once applied', () => {
        const first = releaseHiddenFilters(['login'], fields, filter);
        expect(releaseHiddenFilters(['login'], fields, first)).toBeUndefined();
    });
});
