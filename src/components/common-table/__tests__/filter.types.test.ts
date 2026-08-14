import { describe, expect, it } from 'vitest';
import {
    NUMBER_OPERATORS,
    resolveOperators,
    STRING_OPERATORS,
} from '../types/filter.types';

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

    /**
     * `resolveOperators` intersects, so an operator a column asks for that the built-in list
     * does not carry is dropped in silence. "Has no value" is a question a numeric column is
     * asked as often as a text one, and it can only reach the menu from here.
     */
    it('lets a numeric column ask about the absence of a value', () => {
        const names = NUMBER_OPERATORS.map((operator) => operator.name);
        expect(names).toContain('empty');
        expect(names).toContain('notEmpty');
        expect(
            resolveOperators(
                [
                    { name: 'eq', label: 'eq' },
                    { name: 'empty', label: 'empty' },
                ],
                NUMBER_OPERATORS,
            ).map((operator) => operator.name),
        ).toEqual(['eq', 'empty']);
    });
});
