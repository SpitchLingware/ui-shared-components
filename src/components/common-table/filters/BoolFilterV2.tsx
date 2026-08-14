import { Box, MenuItem, TextField } from '@mui/material';
import React from 'react';
import { useTranslation } from 'react-i18next';
import {
    BOOL_OPERATORS,
    FilterEditorProps,
    resolveOperators,
} from '../types/filter.types';
import { OperatorMenu } from './OperatorMenu';

export const BoolFilterV2: React.FC<FilterEditorProps> = ({
    filter,
    disabled,
    onChange,
    operators,
    filterProps,
}) => {
    const { t } = useTranslation();

    /* a boolean column rarely renders "yes" and "no": it says Active/Archived, Enabled/Disabled.
     * The filter has to offer the words the column itself shows, or it names two states the
     * reader cannot find in the list. */
    const trueLabel = filterProps?.trueLabel || t('table:table.true', 'true');
    const falseLabel =
        filterProps?.falseLabel || t('table:table.false', 'false');

    const current =
        filter.value === true || filter.value === 'true'
            ? 'true'
            : filter.value === false || filter.value === 'false'
              ? 'false'
              : '';

    return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <TextField
                size='small'
                select
                value={current}
                disabled={disabled}
                onChange={(e) => {
                    const v = e.target.value;
                    onChange({
                        value: v === '' ? '' : v === 'true',
                        operator: filter.operator,
                    });
                }}
                sx={{
                    flex: 1,
                    bgcolor: 'background.paper',
                    '& .MuiInputBase-root': { fontSize: '0.8rem' },
                }}>
                <MenuItem value=''>—</MenuItem>
                <MenuItem value='true'>{trueLabel}</MenuItem>
                <MenuItem value='false'>{falseLabel}</MenuItem>
            </TextField>
            <OperatorMenu
                operator={filter.operator}
                operators={resolveOperators(operators, BOOL_OPERATORS)}
                disabled={disabled}
                onChange={(operator) =>
                    onChange({ value: filter.value, operator })
                }
            />
        </Box>
    );
};
