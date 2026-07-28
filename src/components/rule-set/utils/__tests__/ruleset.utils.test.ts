import { describe, it, expect } from 'vitest';
import {
    MAX_SILENCE,
    createEmptyRuleSet,
    defaultRuleSetActionsFlags,
    toggleRulesetAction,
    rulesetActionStyles,
    predefinedValueOnly,
    numbersOnly,
} from '../ruleset.utils';
import type { RuleSetAction } from '../../types/ruleset.types';

describe('MAX_SILENCE', () => {
    it('should equal 86400 seconds (24 hours)', () => {
        expect(MAX_SILENCE).toBe(24 * 60 * 60);
    });
});

describe('createEmptyRuleSet<T>()', () => {
    it('should create a ruleset with uuid and default "and" action', () => {
        const ruleSet = createEmptyRuleSet<string>();
        expect(ruleSet.id).toBeDefined();
        expect(typeof ruleSet.id === 'string').toBe(true);
        expect(ruleSet.type).toBe('ruleset');
        expect(ruleSet.action).toBe('and');
        expect(ruleSet.features).toEqual([]);
    });

    it('should accept generic type parameter', () => {
        const ruleSet = createEmptyRuleSet<{ custom: string }>();
        expect(ruleSet.type).toBe('ruleset');
    });
});

describe('defaultRuleSetActionsFlags()', () => {
    it('should return flags with and/or enabled by default', () => {
        const flags = defaultRuleSetActionsFlags();
        expect(flags.and).toBe(true);
        expect(flags.or).toBe(true);
        // not-and и not-or не определены по умолчанию (undefined)
        expect(flags['not-and']).toBeUndefined();
        expect(flags['not-or']).toBeUndefined();
    });

    it('should return a new object each time', () => {
        const flags1 = defaultRuleSetActionsFlags();
        const flags2 = defaultRuleSetActionsFlags();
        expect(flags1).not.toBe(flags2);
    });
});

describe('toggleRulesetAction(current, flags)', () => {
    const allActions: RuleSetAction[] = ['and', 'or', 'not-and', 'not-or'];

    it('should cycle through enabled actions (only and/or by default)', () => {
        const flags = defaultRuleSetActionsFlags();
        let current: RuleSetAction = 'and';
        current = toggleRulesetAction(current, flags);
        expect(current).toBe('or'); // next in [and, or]
        current = toggleRulesetAction(current, flags);
        expect(current).toBe('and'); // wraps around to first
    });

    it('should skip disabled actions', () => {
        const flags = {
            and: true,
            or: false,
            'not-and': false,
            'not-or': false,
        };
        let current: RuleSetAction = 'and';
        current = toggleRulesetAction(current, flags);
        expect(current).toBe('and'); // stays on same if next is disabled
    });

    it('should handle single enabled action', () => {
        const flags = {
            and: true,
            or: false,
            'not-and': false,
            'not-or': false,
        };
        let current: RuleSetAction = 'and';
        current = toggleRulesetAction(current, flags);
        expect(current).toBe('and'); // loops back to itself
    });

    it('should cycle through all 4 actions when all enabled', () => {
        const flags = { and: true, or: true, 'not-and': true, 'not-or': true };
        let current: RuleSetAction = 'and';
        current = toggleRulesetAction(current, flags);
        expect(current).toBe('or');
        current = toggleRulesetAction(current, flags);
        expect(current).toBe('not-and');
        current = toggleRulesetAction(current, flags);
        expect(current).toBe('not-or');
        current = toggleRulesetAction(current, flags);
        expect(current).toBe('and'); // wraps around
    });

    it('should handle any valid action as starting point', () => {
        const flags = defaultRuleSetActionsFlags();
        allActions.forEach((action) => {
            let current = action;
            const result = toggleRulesetAction(current, flags);
            expect(typeof result).toBe('string');
            expect(allActions.includes(result as RuleSetAction)).toBe(true);
        });
    });

    it('should return first available action if current not in rules list', () => {
        const flags = defaultRuleSetActionsFlags(); // only and, or enabled
        let current: RuleSetAction = 'not-and'; // not in the enabled list
        current = toggleRulesetAction(current, flags);
        expect(current).toBe('and'); // jumps to first available
    });

    it('should handle empty rules list (all disabled)', () => {
        const flags = {
            and: false,
            or: false,
            'not-and': false,
            'not-or': false,
        };
        let current: RuleSetAction = 'and';
        current = toggleRulesetAction(current, flags);
        expect(current).toBe('and'); // returns unchanged if no rules
    });
});

describe('rulesetActionStyles(current?)', () => {
    it('should return color mapping for "and" action', () => {
        const colors = rulesetActionStyles('and');
        expect(colors.primary).toBeDefined();
        expect(colors.secondary).toBeDefined();
    });

    it('should return different colors for different actions', () => {
        const andColors = rulesetActionStyles('and');
        const orColors = rulesetActionStyles('or');
        // Different actions should have different primary colors
        expect(andColors.primary).not.toBe(orColors.primary);
    });

    it('should handle undefined current (fallback)', () => {
        const fallback = rulesetActionStyles();
        expect(fallback.primary).toBeDefined();
        expect(fallback.secondary).toBeDefined();
    });

    it('should return negative colors for not-* actions', () => {
        const notAndColors = rulesetActionStyles('not-and');
        const notOrColors = rulesetActionStyles('not-or');
        expect(notAndColors.primary).toBe(notOrColors.primary); // both use red
    });
});

describe('predefinedValueOnly(values, value)', () => {
    it('should return exact match if valid', () => {
        expect(predefinedValueOnly(['a', 'b', 'c'], 'b')).toBe('b');
    });

    it('should return empty string for invalid value', () => {
        expect(predefinedValueOnly(['a', 'b', 'c'], 'd')).toBe('');
    });

    it('should handle case-sensitive matching', () => {
        expect(predefinedValueOnly(['A', 'B'], 'a')).toBe('');
        expect(predefinedValueOnly(['A', 'B'], 'A')).toBe('A');
    });

    it('should work with numeric-like strings', () => {
        expect(predefinedValueOnly(['123', '456'], '456')).toBe('456');
        expect(predefinedValueOnly(['123', '456'], '789')).toBe('');
    });

    it('should handle empty values array', () => {
        expect(predefinedValueOnly([], 'anything')).toBe('');
    });
});

describe('numbersOnly(value: string)', () => {
    it('should strip non-digit characters', () => {
        expect(numbersOnly('abc123def456')).toBe('123456');
        expect(numbersOnly('100%')).toBe('100');
        expect(numbersOnly('$99.99')).toBe('9999');
    });

    it('should preserve only digits', () => {
        expect(numbersOnly('hello world')).toBe('');
        expect(numbersOnly('1234567890')).toBe('1234567890');
    });

    it('should handle special characters and spaces', () => {
        expect(numbersOnly('  1  2  3  ')).toBe('123');
        expect(numbersOnly('a1b2c3d4e5')).toBe('12345');
    });

    it('should handle empty string', () => {
        expect(numbersOnly('')).toBe('');
    });

    it('should handle strings with only non-digits', () => {
        expect(numbersOnly('!!!')).toBe('');
        expect(numbersOnly('---')).toBe('');
    });
});
