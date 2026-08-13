import ScheduleIcon from '@mui/icons-material/Schedule';
import { Box, IconButton, Tooltip } from '@mui/material';
import { DatePicker, DateTimePicker } from '@mui/x-date-pickers';
import moment, { Moment } from 'moment-timezone';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    DATE_OPERATORS,
    FilterEditorProps,
    RANGE_OPERATORS,
} from '../types/filter.types';
import {
    convertValue,
    valueHasTime,
    withTimeFormat,
} from './date-filter.utils';
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
    /* the bound names an instant: hours and minutes are part of it */
    time?: boolean;
} & Omit<FilterEditorProps['filterProps'], 'withTime'>;

const PickerWithTooltip: React.FC<PickerWithTooltipProps> = ({
    value,
    disabled,
    onChange,
    format,
    timezone,
    time,
}) => {
    const formatted = value && value.isValid() ? value.format(format) : '';
    const shared = {
        value,
        disabled,
        timezone,
        format,
        onChange,
        slotProps: {
            textField: { size: 'small' as const, sx: fieldSx },
            actionBar: { actions: ['clear', 'accept'] as any },
        },
    };
    /* a wider field: the same box that fits a date crops "2026-07-15 14:30" */
    const picker = time ? (
        <DateTimePicker
            {...shared}
            ampm={false}
            slotProps={{
                ...shared.slotProps,
                textField: {
                    ...shared.slotProps.textField,
                    sx: { ...fieldSx, minWidth: 150 },
                },
            }}
        />
    ) : (
        <DatePicker {...shared} />
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
    const { format, timezone, withTime } = filterProps;
    const { t } = useTranslation();

    /* Read off the value, so a filter restored from the table's stored state comes back with the
     * clock already on. It is state as well, because the switch has to survive an empty value —
     * there is nothing to read a time off yet while the operator is picking the first bound. */
    const [time, setTime] = useState(() =>
        Boolean(withTime && valueHasTime(filter.value, format, timezone)),
    );

    const precise = Boolean(withTime && time);
    const activeFormat = precise ? withTimeFormat(format) : format;

    const isRange = RANGE_OPERATORS.has(filter.operator);
    const range = toRange(filter.value);

    const emit = (value: any, operator: string) =>
        onChange({ value, operator });

    const toggleTime = () => {
        const next = !time;
        setTime(next);
        /* the bounds already chosen are rewritten rather than dropped: asking for more precision
         * must not empty the filter the operator has been narrowing */
        emit(
            convertValue(filter.value, format, timezone, next),
            filter.operator,
        );
    };

    const clock = withTime ? (
        <Tooltip
            title={t('table:table.specify_time', 'Specify the time')}
            placement='top'>
            <span>
                <IconButton
                    size='small'
                    disabled={disabled}
                    color={precise ? 'primary' : 'default'}
                    onClick={toggleTime}
                    sx={{ p: 0.25 }}>
                    <ScheduleIcon fontSize='small' />
                </IconButton>
            </span>
        </Tooltip>
    ) : null;

    return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            {isRange ? (
                <Box sx={{ display: 'flex', gap: 0.5, flex: 1, minWidth: 0 }}>
                    <PickerWithTooltip
                        value={toMoment(range.start, timezone)}
                        timezone={timezone}
                        format={activeFormat}
                        time={precise}
                        disabled={disabled}
                        onChange={(v) =>
                            emit(
                                {
                                    ...range,
                                    start: fromMoment(v, activeFormat),
                                },
                                filter.operator,
                            )
                        }
                    />
                    <PickerWithTooltip
                        value={toMoment(range.end, timezone)}
                        timezone={timezone}
                        format={activeFormat}
                        time={precise}
                        disabled={disabled}
                        onChange={(v) =>
                            emit(
                                { ...range, end: fromMoment(v, activeFormat) },
                                filter.operator,
                            )
                        }
                    />
                </Box>
            ) : (
                <PickerWithTooltip
                    value={toMoment(filter.value, timezone)}
                    timezone={timezone}
                    format={activeFormat}
                    time={precise}
                    disabled={disabled}
                    onChange={(v) =>
                        emit(fromMoment(v, activeFormat), filter.operator)
                    }
                />
            )}
            {clock}
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
