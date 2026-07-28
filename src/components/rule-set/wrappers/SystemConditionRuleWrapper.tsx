import { MenuItem, Stack, TextField } from '@mui/material';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { RuleComponentProps } from '../RuleEditor';

type Condition = {
    field: string;
    operation: 'eq' | 'ne' | 'startsWith' | 'endsWith' | 'regex' | 'contains';
    value: string;
};

type Props = RuleComponentProps<Condition, {}>;

const localPath = 'wrappers.system-condition';

export const SystemConditionRuleWrapper = (
    props: Props,
): ReturnType<React.FC<Props>> => {
    const { t } = useTranslation();
    const { prefix, onChange, rule, readonly, i18nTag } = props;

    const operations = useMemo((): Array<{
        value: Condition['operation'];
        label: string;
    }> => {
        const _ops: Array<Condition['operation']> = [
            'eq',
            'ne',
            'contains',
            'startsWith',
            'endsWith',
            'regex',
        ];
        return _ops.map((op) => ({
            value: op,
            label: t(`${i18nTag}.${localPath}.operations.${op}`, op),
        }));
    }, [i18nTag, t]);

    const fields = [
        { value: 'content', label: 'content' },
        { value: 'sender_id', label: 'sender_id' },
    ];

    return (
        <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={1}
            sx={{ width: '100%' }}>
            <TextField
                label={t(`${i18nTag}.${localPath}.field`, 'Field')}
                value={rule.field || ''}
                disabled={readonly}
                size='small'
                fullWidth
                select
                onChange={(event) => {
                    onChange(`${prefix}.field`, event.target.value);
                }}
                slotProps={{
                    inputLabel: { shrink: true },
                }}>
                {fields.map((op) => (
                    <MenuItem key={op.value} value={op.value}>
                        {op.label}
                    </MenuItem>
                ))}
            </TextField>
            <TextField
                label={t(`${i18nTag}.${localPath}.operation`, 'Operation')}
                value={rule.operation || ''}
                disabled={readonly}
                size='small'
                fullWidth
                select
                onChange={(event) => {
                    onChange(`${prefix}.operation`, event.target.value);
                }}
                slotProps={{
                    inputLabel: { shrink: true },
                }}>
                {operations.map((op) => (
                    <MenuItem key={op.value} value={op.value}>
                        {op.label}
                    </MenuItem>
                ))}
            </TextField>
            <TextField
                label={t(`${i18nTag}.${localPath}.value`, 'Value')}
                value={rule.value || ''}
                disabled={readonly}
                size='small'
                fullWidth
                onChange={(event) => {
                    onChange(`${prefix}.value`, event.target.value);
                }}
                slotProps={{
                    inputLabel: { shrink: true },
                }}
            />
        </Stack>
    );
};
