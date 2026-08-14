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
}) => {
    const { t } = useTranslation();

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
                <MenuItem value='true'>
                    {t('table:table.true', 'true')}
                </MenuItem>
                <MenuItem value='false'>
                    {t('table:table.false', 'false')}
                </MenuItem>
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
