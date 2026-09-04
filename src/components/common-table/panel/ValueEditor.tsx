import { Box, Typography } from '@mui/material';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    CommonTableV2ColumnSettings,
    CommonTableV2FilterValue,
    FilterChange,
    TableField,
} from '../types';
import { overlineSx } from './editor.styles';
import { EditorFooter } from './EditorFooter';
import { EditorHeader } from './EditorHeader';
import {
    emptyValueFor,
    isFilterUntouched,
    isOptionField,
    operatorsForField,
    valueForOperator,
    VALUELESS_OPERATORS,
} from './filter-value.utils';
import { OperatorSelect } from './OperatorSelect';
import { SelectOptionList } from './SelectOptionList';

type Props = {
    field: TableField;
    setting: CommonTableV2ColumnSettings;
    filter: CommonTableV2FilterValue;
    title: string;
    /** what «Сбросить» puts the column back to */
    reset: FilterChange;
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
    reset,
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
    const operators = operatorsForField(field, setting.filterProps?.operators);
    /* «пусто» / «не пусто» are the whole filter — there is nothing left to
       type, so the field goes away rather than standing there disabled */
    const valueless = VALUELESS_OPERATORS.has(draft.operator);

    return (
        <Box
            sx={{
                width: { xs: 280, sm: 360 },
                p: 2,
                display: 'flex',
                flexDirection: 'column',
                gap: 1.75,
            }}>
            <EditorHeader title={title} />

            {operators.length > 0 && (
                <OperatorSelect
                    operator={draft.operator}
                    operators={operators}
                    onChange={(operator) =>
                        setDraft({
                            operator,
                            value: valueForOperator(draft.value, operator),
                        })
                    }
                />
            )}

            {!valueless && (
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 0.75,
                    }}>
                    <Typography sx={overlineSx}>
                        {t('table:table.value', 'Value')}
                    </Typography>
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
                                hideOperator
                                filterProps={setting.filterProps}
                                onChange={(change: FilterChange) =>
                                    setDraft(change)
                                }
                            />
                        )
                    )}
                </Box>
            )}

            <EditorFooter
                secondaryLabel={t('table:table.cancel', 'Cancel')}
                onSecondary={onClose}
                clearDisabled={isFilterUntouched(draft, reset)}
                onClear={() => {
                    onApply(reset);
                    onClose();
                }}
                onApply={() => {
                    /* the draft keeps the text a valueless operator was
                       switched away from; what leaves the popover does not */
                    onApply(
                        valueless
                            ? {
                                  ...draft,
                                  value: emptyValueFor(draft.value),
                              }
                            : draft,
                    );
                    onClose();
                }}
            />
        </Box>
    );
};
