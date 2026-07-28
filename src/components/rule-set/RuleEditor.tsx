import { DeleteForever, Edit, EditOff } from '@mui/icons-material';
import { Box, IconButton, styled, Tooltip } from '@mui/material';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { RuleBase, RuleSetAction } from './types';
import { InRuleAction, rulesetActionStyles, UpdateSelectedFlag } from './utils';

export type RuleComponentProps<RuleExtension, Data> = {
    prefix: string;
    onChange: (
        name: string | string[],
        value: any,
        updateSelected?: UpdateSelectedFlag,
    ) => void;
    rule: RuleBase<RuleExtension>;
    data: Data;
    inRuleAction?: (action: InRuleAction) => void;
    readonly?: boolean;
    i18nTag: string;
};

type Props<Rule, Data> = {
    prefix: string;
    rule: RuleBase<Rule>;
    parentAction?: RuleSetAction;
    onChange: (name: string | string[], value: any) => void;
    onDelete?: () => void;
    data: Data;
    last: boolean;
    editField?: string;
    setEditField?: (field?: string) => void;
    wrapper: {
        static: React.ComponentType<RuleComponentProps<Rule, Data>>;
        inline?: React.ComponentType<RuleComponentProps<Rule, Data>>;
    };
    inRuleAction?: (action: InRuleAction) => void;
    readonly?: boolean;
    i18nTag: string;
};

export const RuleEditor = <Rule, Data>(
    props: Props<Rule, Data>,
): ReturnType<React.FC<Props<Rule, Data>>> => {
    const {
        prefix,
        parentAction,
        onChange,
        onDelete,
        rule,
        data,
        last,
        wrapper,
        editField,
        setEditField,
        inRuleAction,
        readonly,
        i18nTag,
    } = props;

    const { t } = useTranslation();

    const editMode = editField === prefix;
    const Wrapper =
        editMode && wrapper.inline ? wrapper.inline : wrapper.static;

    const { secondary } = rulesetActionStyles(parentAction);
    return (
        <StyledRoot>
            <StyledList
                sx={{
                    border: `1px solid ${secondary}`,
                    '&:before': {
                        border: `1px solid ${secondary}`,
                    },
                }}
                last={last}
            />
            <Wrapper
                prefix={prefix}
                onChange={onChange}
                rule={rule}
                data={data}
                inRuleAction={inRuleAction}
                readonly={readonly}
                i18nTag={i18nTag}
            />
            <Box component={'div'} sx={{ flex: 1 }} />
            <Box
                component={'div'}
                sx={{ display: 'flex', alignItems: 'center' }}>
                {setEditField && wrapper.inline ? (
                    <Tooltip
                        title={t(`${i18nTag}.buttons.edit`, 'edit') as string}>
                        <div>
                            <IconButton
                                disabled={readonly}
                                onClick={() => {
                                    setEditField(editMode ? undefined : prefix);
                                }}>
                                {editMode ? (
                                    <EditOff fontSize={'inherit'} />
                                ) : (
                                    <Edit fontSize={'inherit'} />
                                )}
                            </IconButton>
                        </div>
                    </Tooltip>
                ) : null}
                {onDelete ? (
                    <Tooltip
                        title={
                            t(
                                `${i18nTag}.buttons.remove_element`,
                                'Remove',
                            ) as string
                        }>
                        <div>
                            <IconButton
                                onClick={onDelete}
                                color={'error'}
                                disabled={readonly}>
                                <DeleteForever fontSize={'inherit'} />
                            </IconButton>
                        </div>
                    </Tooltip>
                ) : null}
            </Box>
        </StyledRoot>
    );
};

const StyledRoot = styled('div')({
    position: 'relative',
    marginTop: 5,
    marginLeft: 20,
    display: 'flex',
});

const StyledList = styled('div', {
    shouldForwardProp(propName: PropertyKey): boolean {
        return propName !== 'last';
    },
})<{ last: boolean }>(({ last }) => {
    return {
        boxSizing: 'border-box',
        position: 'absolute',

        height: last ? 'calc(50% + 2px + 5px)' : 'calc(100% + 2px + 5px)',
        top: -6,
        left: -14,
        '&:before': {
            position: 'absolute',
            content: '""',

            top: last ? '100%' : '50%',
            left: -1,
            width: 13,
        },
    };
});
