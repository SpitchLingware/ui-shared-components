import { describe, it, expect } from 'vitest';
import { validateRuleSet } from '../ruleset.validation';
import type { RuleBase, RuleSetNoId, RuleSetAction } from '../../types/ruleset.types';

describe('validateRuleSet<T>()', () => {
    const createRule = (id: string = 'rule-1'): any => ({
        id,
        type: 'rule',
    });

    const createRuleset = <T>(action: RuleSetAction = 'and', features: any[] = []): RuleSetNoId<T> => ({
        type: 'ruleset' as any,
        action,
        features,
    });

    describe('empty/undefined rulesets', () => {
        it('should return true for undefined ruleSet', () => {
            expect(validateRuleSet(undefined, () => true)).toBe(true);
        });

        it('should return true for empty features array', () => {
            const ruleSet = createRuleset<string>('and', []);
            expect(validateRuleSet(ruleSet, () => true)).toBe(true);
        });
    });

    describe('valid rules', () => {
        it('should validate a single valid rule', () => {
            const ruleSet = createRuleset<string>('and', [createRule()]);
            expect(validateRuleSet(ruleSet, () => true)).toBe(true);
        });

        it('should validate multiple valid rules', () => {
            const ruleSet = createRuleset<string>('and', [
                createRule(),
                createRule(),
                createRule(),
            ]);
            expect(validateRuleSet(ruleSet, () => true)).toBe(true);
        });

        it('should validate nested valid rulesets', () => {
            const ruleSet = createRuleset<string>('and', [
                createRuleset<string>('and', [createRule()]),
            ]);
            expect(validateRuleSet(ruleSet, () => true)).toBe(true);
        });

        it('should validate deeply nested rules', () => {
            const ruleSet = createRuleset<string>('and', [
                createRuleset<string>('and', [
                    createRuleset<string>('and', [createRule()]),
                ]),
            ]);
            expect(validateRuleSet(ruleSet, () => true)).toBe(true);
        });

        it('should use custom validator for rules', () => {
            const ruleSet = createRuleset<string>('and', [createRule()]);
            const validate = (rule: RuleBase<string>) => rule.id === 'rule-1';
            expect(validateRuleSet(ruleSet, validate)).toBe(true);
        });

        it('should reject invalid rules via custom validator', () => {
            const ruleSet = createRuleset<string>('and', [createRule()]);
            const validate = (rule: RuleBase<string>) => rule.id === 'wrong-id';
            expect(validateRuleSet(ruleSet, validate)).toBe(false);
        });
    });

    describe('invalid structures', () => {
        it('should return false if any feature fails validation', () => {
            const ruleSet = createRuleset<string>('and', [
                createRule(), // valid
                createRule('bad-rule'), // invalid per validator
            ]);
            const validate = (rule: RuleBase<string>) => rule.id === 'valid';
            expect(validateRuleSet(ruleSet, validate)).toBe(false);
        });

        it('should detect invalid nested rulesets', () => {
            const ruleSet = createRuleset<string>('and', [
                createRuleset<string>('and', [createRule()]), // valid at top level
                createRuleset<string>('and', [createRule()]), // also valid nested, but...
            ]);

            const validate = (rule: RuleBase<string>) => rule.id === 'bad-rule';
            expect(validateRuleSet(ruleSet, validate)).toBe(false);
        });

        it('should handle mixed rules and nested rulesets', () => {
            const validRule = createRule();
            const validNested = createRuleset<string>('and', [createRule()]);

            const ruleSet = createRuleset<string>('and', [validRule, validNested]);

            expect(validateRuleSet(ruleSet, () => true)).toBe(true);
        });
    });

    describe('edge cases', () => {
        it('should handle rules with type !== "rule" (nested rulesets)', () => {
            const nestedRuleset = createRuleset<string>('and', [createRule()]);

            const ruleSet = createRuleset<string>('and', [nestedRuleset]);

            expect(validateRuleSet(ruleSet, () => true)).toBe(true);
        });

        it('should stop at first invalid feature (short-circuit)', () => {
            let validationCount = 0;
            const ruleSet = createRuleset<string>('and', [
                createRule(), // valid
                createRule('bad'), // invalid - stops here
                createRule(), // never validated
            ]);

            const validate = (rule: RuleBase<string>) => {
                validationCount++;
                return rule.id !== 'bad';
            };

            expect(validateRuleSet(ruleSet, validate)).toBe(false);
            expect(validationCount).toBe(2); // only 2 validations ran
        });
    });
});
