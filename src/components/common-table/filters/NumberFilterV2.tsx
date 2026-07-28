import { Box, TextField } from '@mui/material';
import { debounce } from 'lodash';
import React, { useEffect, useMemo, useState } from 'react';
import { FilterEditorProps, NUMBER_OPERATORS, RANGE_OPERATORS } from '../types';
import { OperatorMenu } from './OperatorMenu';

type RangeValue = { start?: number | ''; end?: number | '' };

const toRange = (raw: any): RangeValue => {
    if (raw && typeof raw === 'object') {
        return { start: raw.start ?? '', end: raw.end ?? '' };
    }
    return { start: '', end: '' };
};

const toScalar = (raw: any): string => {
    if (raw === undefined || raw === null || raw === '') return '';
    if (typeof raw === 'object') return '';
    return String(raw);
};

const parseNumber = (v: string): number | '' => {
    if (v === '') return '';
    const n = Number(v);
    return Number.isFinite(n) ? n : '';
};

export const NumberFilterV2: React.FC<FilterEditorProps> = ({
    filter,
    disabled,
    onChange,
}) => {
    const isRange = RANGE_OPERATORS.has(filter.operator);

    const [scalar, setScalar] = useState<string>(toScalar(filter.value));
    const [range, setRange] = useState<RangeValue>(toRange(filter.value));

    useEffect(() => {
        if (isRange) setRange(toRange(filter.value));
        else setScalar(toScalar(filter.value));
    }, [filter.value, isRange]);

    const pushChange = useMemo(
        () =>
            debounce((value: any, operator: string) => {
                onChange({ value, operator });
            }, 400),
        [onChange],
    );

    return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            {isRange ? (
                <Box sx={{ display: 'flex', gap: 0.5, flex: 1 }}>
                    <TextField
                        size='small'
                        type='number'
                        value={range.start ?? ''}
                        disabled={disabled}
                        onChange={(e) => {
                            const next = {
                                ...range,
                                start: parseNumber(e.target.value),
                            };
                            setRange(next);
                            pushChange(next, filter.operator);
                        }}
                        sx={{
                            flex: 1,
                            bgcolor: 'background.paper',
                            '& .MuiInputBase-root': { fontSize: '0.8rem' },
                        }}
                    />
                    <TextField
                        size='small'
                        type='number'
                        value={range.end ?? ''}
                        disabled={disabled}
                        onChange={(e) => {
                            const next = {
                                ...range,
                                end: parseNumber(e.target.value),
                            };
                            setRange(next);
                            pushChange(next, filter.operator);
                        }}
                        sx={{
                            flex: 1,
                            bgcolor: 'background.paper',
                            '& .MuiInputBase-root': { fontSize: '0.8rem' },
                        }}
                    />
                </Box>
            ) : (
                <TextField
                    size='small'
                    type='number'
                    value={scalar}
                    disabled={disabled}
                    onChange={(e) => {
                        const v = e.target.value;
                        setScalar(v);
                        pushChange(parseNumber(v), filter.operator);
                    }}
                    sx={{
                        flex: 1,
                        bgcolor: 'background.paper',
                        '& .MuiInputBase-root': { fontSize: '0.8rem' },
                    }}
                />
            )}
            <OperatorMenu
                operator={filter.operator}
                operators={NUMBER_OPERATORS}
                disabled={disabled}
                onChange={(operator) => {
                    pushChange.cancel();
                    const becomingRange = RANGE_OPERATORS.has(operator);
                    if (becomingRange && !isRange) {
                        onChange({ value: { start: '', end: '' }, operator });
                    } else if (!becomingRange && isRange) {
                        onChange({ value: '', operator });
                    } else {
                        onChange({ value: filter.value, operator });
                    }
                }}
            />
        </Box>
    );
};
