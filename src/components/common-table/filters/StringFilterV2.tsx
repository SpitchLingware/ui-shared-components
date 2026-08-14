import { Box, TextField } from '@mui/material';
import { debounce } from 'lodash';
import React, { useEffect, useMemo, useState } from 'react';
import { FilterEditorProps, STRING_OPERATORS } from '../types/filter.types';
import { OperatorMenu } from './OperatorMenu';

const VALUELESS = new Set(['empty', 'notEmpty']);

export const StringFilterV2: React.FC<FilterEditorProps> = ({
    filter,
    disabled,
    immediate,
    onChange,
}) => {
    const [local, setLocal] = useState<string>(
        typeof filter.value === 'string' ? filter.value : '',
    );

    useEffect(() => {
        const next = typeof filter.value === 'string' ? filter.value : '';
        setLocal(next);
    }, [filter.value]);

    const pushChange = useMemo(() => {
        const push = (value: string, operator: string) =>
            onChange({ value, operator });
        if (immediate) return Object.assign(push, { cancel: () => {} });
        return debounce(push, 400);
    }, [immediate, onChange]);

    const valueless = VALUELESS.has(filter.operator);

    return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <TextField
                size='small'
                value={valueless ? '' : local}
                placeholder=''
                disabled={disabled || valueless}
                onChange={(e) => {
                    const v = e.target.value;
                    setLocal(v);
                    pushChange(v, filter.operator);
                }}
                sx={{
                    flex: 1,
                    bgcolor: 'background.paper',
                    '& .MuiInputBase-root': { fontSize: '0.8rem' },
                }}
            />
            <OperatorMenu
                operator={filter.operator}
                operators={STRING_OPERATORS}
                disabled={disabled}
                onChange={(operator) => {
                    pushChange.cancel();
                    onChange({
                        value: VALUELESS.has(operator) ? '' : local,
                        operator,
                    });
                }}
            />
        </Box>
    );
};
