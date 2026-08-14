import { describe, expect, it } from 'vitest';
import { resolveOperators, STRING_OPERATORS } from '../types/filter.types';

describe('resolveOperators', () => {
    it('keeps the built-in list when the column names no subset', () => {
        expect(resolveOperators(undefined, STRING_OPERATORS)).toBe(
            STRING_OPERATORS,
        );
        expect(resolveOperators([], STRING_OPERATORS)).toBe(STRING_OPERATORS);
    });

    it('narrows to the named operators, in the built-in order', () => {
        const narrowed = resolveOperators(
            [
                { name: 'eq', label: 'eq' },
                { name: 'contains', label: 'contains' },
            ],
            STRING_OPERATORS,
        );
        expect(narrowed.map((operator) => operator.name)).toEqual([
            'contains',
            'eq',
        ]);
    });

    it('falls back to the named operators when none of them is built in', () => {
        const custom = [{ name: 'matches', label: 'matches' }];
        expect(resolveOperators(custom, STRING_OPERATORS)).toBe(custom);
    });
});
