import { Box, Tooltip } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import moment, { Moment } from 'moment-timezone';
import React from 'react';
import {
    DATE_OPERATORS,
    FilterEditorProps,
    RANGE_OPERATORS,
} from '../types/filter.types';
import { OperatorMenu } from './OperatorMenu';

type RangeValue = { start?: string; end?: string };

const toRange = (raw: any): RangeValue => {
    if (raw && typeof raw === 'object') {
        return { start: raw.start ?? '', end: raw.end ?? '' };
    }
    return { start: '', end: '' };
};

const toMoment = (raw: any, timezone: string): Moment | null => {
    if (!raw) return null;
    const m = moment(raw).tz(timezone);
    return m.isValid() ? m : null;
};

const fromMoment = (m: Moment | null, format: string): string =>
    m && m.isValid() ? m.format(format) : '';

const fieldSx = {
    flex: 1,
    minWidth: 0,
    bgcolor: 'background.paper',
    '& .MuiInputBase-root': { fontSize: '0.8rem' },
};

type PickerWithTooltipProps = {
    value: Moment | null;
    disabled?: boolean;
    onChange: (v: Moment | null) => void;
} & FilterEditorProps['filterProps'];

const PickerWithTooltip: React.FC<PickerWithTooltipProps> = ({
    value,
    disabled,
    onChange,
    format,
    timezone,
}) => {
    const formatted = value && value.isValid() ? value.format(format) : '';
    const picker = (
        <DatePicker
            value={value}
            disabled={disabled}
            timezone={timezone}
            format={format}
            onChange={onChange}
            slotProps={{
                textField: { size: 'small', sx: fieldSx },
                actionBar: { actions: ['clear', 'accept'] },
            }}
        />
    );
    if (!formatted) return picker;
    return (
        <Tooltip title={formatted} placement='bottom' arrow>
            <Box sx={{ flex: 1, minWidth: 0, display: 'flex' }}>{picker}</Box>
        </Tooltip>
    );
};

export const DateFilterV2: React.FC<FilterEditorProps> = ({
    filter,
    disabled,
    onChange,
    filterProps,
}) => {
    const { format, timezone } = filterProps;

    const isRange = RANGE_OPERATORS.has(filter.operator);
    const range = toRange(filter.value);

    const emit = (value: any, operator: string) =>
        onChange({ value, operator });

    return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            {isRange ? (
                <Box sx={{ display: 'flex', gap: 0.5, flex: 1, minWidth: 0 }}>
                    <PickerWithTooltip
                        value={toMoment(range.start, timezone)}
                        timezone={timezone}
                        format={format}
                        disabled={disabled}
                        onChange={(v) =>
                            emit(
                                { ...range, start: fromMoment(v, format) },
                                filter.operator,
                            )
                        }
                    />
                    <PickerWithTooltip
                        value={toMoment(range.end, timezone)}
                        timezone={timezone}
                        format={format}
                        disabled={disabled}
                        onChange={(v) =>
                            emit(
                                { ...range, end: fromMoment(v, format) },
                                filter.operator,
                            )
                        }
                    />
                </Box>
            ) : (
                <PickerWithTooltip
                    value={toMoment(filter.value, timezone)}
                    timezone={timezone}
                    format={format}
                    disabled={disabled}
                    onChange={(v) =>
                        emit(fromMoment(v, format), filter.operator)
                    }
                />
            )}
            <OperatorMenu
                operator={filter.operator}
                operators={DATE_OPERATORS}
                disabled={disabled}
                onChange={(operator) => {
                    const becomingRange = RANGE_OPERATORS.has(operator);
                    if (becomingRange && !isRange) {
                        emit({ start: '', end: '' }, operator);
                    } else if (!becomingRange && isRange) {
                        emit('', operator);
                    } else {
                        emit(filter.value, operator);
                    }
                }}
            />
        </Box>
    );
};
