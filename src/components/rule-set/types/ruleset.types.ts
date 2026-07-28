/*
 * types here are copied from @artcosoft/model-types
 * to remove private dependencies from this package
 *
 */

export type RuleSetAction = 'and' | 'or' | 'not-and' | 'not-or';

export type RuleSetActionsFlags = {
    [K in RuleSetAction]?: boolean;
};

export type RuleBase<Ext = {}> = {
    id: string;
    type: 'rule';
} & Ext;

export type RuleSet<RuleExtension, Ext = {}> = RuleSetNoId<
    RuleExtension,
    Ext
> & {
    id: string;
};

export type RuleSetNoId<RuleExtension, Ext = {}> = {
    type: 'ruleset';
    label?: string;
    action: RuleSetAction;
    features: Array<
        RuleSet<RuleBase<RuleExtension>, Ext> | RuleBase<RuleExtension>
    >;
} & Ext;
