import { RuleBase, RuleSetNoId } from '../types';

export const validateRuleSet = <T>(
    ruleSet: RuleSetNoId<T> | undefined,
    validateRule: (rule: RuleBase<T>) => boolean,
) => {
    /* empty ruleset is considered VALID */
    if (!ruleSet || !Array.isArray(ruleSet.features)) return true;

    for (let rule of ruleSet.features) {
        let isValid: boolean = true;

        if (rule.type === 'rule') {
            isValid = validateRule(rule);
        } else {
            isValid = validateRuleSet(rule, validateRule);
        }

        if (!isValid) return false;
    }

    return true;
};
