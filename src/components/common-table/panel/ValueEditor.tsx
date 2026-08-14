import { Box, Typography } from '@mui/material';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { OperatorMenu } from '../filters/OperatorMenu';
import {
    CommonTableV2ColumnSettings,
    CommonTableV2FilterValue,
    FilterChange,
    SELECT_OPERATORS,
    TableField,
} from '../types';
import { EditorFooter } from './EditorFooter';
import { isOptionField } from './filter-value.utils';
import { SelectOptionList } from './SelectOptionList';

type Props = {
    field: TableField;
    setting: CommonTableV2ColumnSettings;
    filter: CommonTableV2FilterValue;
    title: string;
    onApply: (change: FilterChange) => void;
    onClose: () => void;
};

const toIdList = (raw: any): Array<string> => {
    if (Array.isArray(raw)) return raw.map(String);
    if (raw === undefined || raw === null || raw === '') return [];
    return [String(raw)];
};

export const ValueEditor: React.FC<Props> = ({
    field,
    setting,
    filter,
    title,
    onApply,
    onClose,
}) => {
    const { t } = useTranslation();
    const [draft, setDraft] = useState<FilterChange>({
        value: filter.value,
        operator: filter.operator,
    });

    const FilterComp = setting.filter as React.FC<any> | undefined;
    const options = isOptionField(field);

    return (
        <Box
            sx={{
                width: { xs: 260, sm: 300 },
                p: 2,
                display: 'flex',
                flexDirection: 'column',
                gap: 1.5,
            }}>
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 1,
                }}>
                <Typography
                    sx={{
                        fontSize: '0.6875rem',
                        fontWeight: 600,
                        letterSpacing: '.04em',
                        textTransform: 'uppercase',
                        color: 'text.secondary',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                    }}>
                    {title}
                </Typography>
                {options && (
                    <OperatorMenu
                        operator={draft.operator}
                        operators={SELECT_OPERATORS}
                        onChange={(operator) => setDraft({ ...draft, operator })}
                    />
                )}
            </Box>

            {options ? (
                <SelectOptionList
                    source={setting.filterProps?.dataSource}
                    value={toIdList(draft.value)}
                    onChange={(value) => setDraft({ ...draft, value })}
                />
            ) : (
                FilterComp && (
                    <FilterComp
                        filter={{ ...filter, ...draft }}
                        immediate
                        filterProps={setting.filterProps}
                        onChange={(change: FilterChange) => setDraft(change)}
                    />
                )
            )}

            <EditorFooter
                secondaryLabel={t('table:table.cancel', 'Cancel')}
                onSecondary={onClose}
                onApply={() => {
                    onApply(draft);
                    onClose();
                }}
            />
        </Box>
    );
};
