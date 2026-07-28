import { blue, green, grey, red } from '@mui/material/colors';
import { v4 } from 'uuid';
import {
    RuleBase,
    RuleSet,
    RuleSetAction,
    RuleSetActionsFlags,
} from '../types';

export const MAX_SILENCE = 24 * 60 * 60;
// export const MAX_DISTANCE = 100;

export type InRuleAction = 'run';

export type UpdateSelectedFlag = 'set' | 'clear';

export type RulesetColors = {
    primary: string;
    secondary: string;
};

export const createEmptyRuleSet = <T>(
    ...features: Array<RuleBase<T> | RuleSet<T>>
): RuleSet<T> => {
    return {
        id: v4(),
        type: 'ruleset',
        action: 'and',
        features: features,
        label: '',
    };
};

export const defaultRuleSetActionsFlags = (): RuleSetActionsFlags => {
    return {
        and: true,
        or: true,
    };
};

export const toggleRulesetAction = (
    current: RuleSetAction,
    flags: RuleSetActionsFlags,
): RuleSetAction => {
    const rules: Array<RuleSetAction> = [];
    /* push in certain order */
    if (flags.and) rules.push('and');
    if (flags.or) rules.push('or');
    if (flags['not-and']) rules.push('not-and');
    if (flags['not-or']) rules.push('not-or');

    const currentIdx = rules.findIndex((r) => r === current);
    if (rules.length === 0) return current;
    if (currentIdx === -1) return rules[0];

    return rules[(currentIdx + 1) % rules.length];
};

export const rulesetActionStyles = (current?: RuleSetAction): RulesetColors => {
    switch (current) {
        case 'not-and':
            return negativeColors();
        case 'and':
            return {
                primary: green[800],
                secondary: green[100],
            };
        case 'not-or':
            return negativeColors();
        case 'or':
            return {
                primary: blue[800],
                secondary: blue[100],
            };
    }

    return defaultGreyColors();
};

export const negativeColors = (): RulesetColors => {
    return {
        primary: red[800],
        secondary: red[100],
    };
};

export const defaultGreyColors = (): RulesetColors => {
    return {
        primary: grey[800],
        secondary: grey[100],
    };
};

export const predefinedValueOnly = (values: Array<string>, value: string) => {
    if (values.some((v) => v === value)) return value;
    return '';
};

export const numbersOnly = (value: string) => {
    return value.replaceAll(/\D+/g, '');
};
