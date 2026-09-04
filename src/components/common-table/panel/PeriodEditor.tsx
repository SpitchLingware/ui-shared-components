import { Box, ListItemButton, Switch, Typography } from '@mui/material';
import { DatePicker, DateTimePicker } from '@mui/x-date-pickers';
import { Moment } from 'moment-timezone';
import React, { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    convertValue,
    parseBound,
    withTimeFormat,
} from '../filters/date-filter.utils';
import {
    CommonTableV2FilterValue,
    DATE_OPERATORS,
    FilterChange,
    RANGE_OPERATORS,
} from '../types';
import { labelSx, overlineSx } from './editor.styles';
import { EditorFooter } from './EditorFooter';
import {
    emptyValueFor,
    isRangeValue,
    valueForOperator,
} from './filter-value.utils';
import { OperatorSelect } from './OperatorSelect';
import {
    QUICK_RANGES,
    detectQuickRange,
    quickRangeBounds,
} from './period.utils';

type Props = {
    filter: CommonTableV2FilterValue;
    format: string;
    timezone: string;
    /** whether the table offers a time-precise bound at all */
    timeAvailable?: boolean;
    time: boolean;
    onTimeChange: (next: boolean) => void;
    onApply: (change: FilterChange) => void;
    onClose: () => void;
};

const PANEL_WIDTH = 168;
/* the editor pane: two bounds side by side. With the time on a bound reads
   `YYYY-MM-DD HH:mm`, whose placeholder is wider than the date one — without
   the extra room the second picker is pushed past the popover's edge and
   clipped, because a text field's min-content width outgrows its half. */
const EDITOR_WIDTH = 392;
const EDITOR_WIDTH_WITH_TIME = 452;

const toRange = (raw: any) =>
    isRangeValue(raw)
        ? { start: raw.start ?? '', end: raw.end ?? '' }
        : { start: '', end: '' };

export const PeriodEditor: React.FC<Props> = ({
    filter,
    format,
    timezone,
    timeAvailable,
    time,
    onTimeChange,
    onApply,
    onClose,
}) => {
    const { t } = useTranslation();

    const [draft, setDraft] = useState<CommonTableV2FilterValue>(filter);
    const startRef = useRef<HTMLInputElement | null>(null);

    const activeFormat = time ? withTimeFormat(format) : format;
    const isRange = RANGE_OPERATORS.has(draft.operator);
    const range = toRange(draft.value);

    const quick = detectQuickRange(draft, timezone, format, time);

    const toMoment = (raw: any): Moment | null =>
        parseBound(raw, format, timezone);

    const fromMoment = (m: Moment | null): string =>
        m && m.isValid() ? m.format(activeFormat) : '';

    const toggleTime = () => {
        const next = !time;
        onTimeChange(next);
        setDraft({
            ...draft,
            value: convertValue(draft.value, format, timezone, next),
        });
    };

    const applyQuick = (id: string) => {
        if (id === 'custom') {
            startRef.current?.focus();
            return;
        }
        const bounds = quickRangeBounds(id as any, timezone, format, time);
        if (!bounds) return;
        setDraft({ ...draft, operator: 'inrange', value: bounds });
        onApply({ value: bounds, operator: 'inrange' });
    };

    const renderPicker = (
        value: any,
        label: string,
        onPicked: (next: string) => void,
        inputRef?: React.Ref<HTMLInputElement>,
    ) => {
        const shared = {
            value: toMoment(value),
            timezone,
            format: activeFormat,
            onChange: (m: Moment | null) => onPicked(fromMoment(m)),
            slotProps: {
                textField: {
                    size: 'small' as const,
                    fullWidth: true,
                    inputRef,
                },
                actionBar: { actions: ['clear', 'accept'] as any },
            },
        };
        return (
            <Box
                sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}
                key={label}>
                <Typography component='label' sx={labelSx}>
                    {label}
                </Typography>
                {time ? (
                    <DateTimePicker {...shared} ampm={false} />
                ) : (
                    <DatePicker {...shared} />
                )}
            </Box>
        );
    };

    return (
        <Box
            sx={{
                display: 'flex',
                width: {
                    xs: 'auto',
                    sm:
                        PANEL_WIDTH +
                        (time && isRange ? EDITOR_WIDTH_WITH_TIME : EDITOR_WIDTH),
                },
            }}>
            <Box
                sx={{
                    width: PANEL_WIDTH,
                    flexShrink: 0,
                    borderRight: '1px solid',
                    borderColor: 'divider',
                    p: 1,
                    display: { xs: 'none', sm: 'flex' },
                    flexDirection: 'column',
                    gap: '2px',
                }}>
                <Typography sx={{ ...overlineSx, px: 1, pt: 0.75, pb: 0.5 }}>
                    {t('table:table.quick_select', 'Quick select')}
                </Typography>
                {QUICK_RANGES.map((id) => (
                    <ListItemButton
                        key={id}
                        selected={quick === id}
                        onClick={() => applyQuick(id)}
                        sx={{ py: '7px', px: 1, borderRadius: 1 }}>
                        <Typography variant='body2'>
                            {t(`table:table.${id}`, id)}
                        </Typography>
                    </ListItemButton>
                ))}
            </Box>

            <Box
                sx={{
                    flex: 1,
                    /* narrow: no quick-select column, so the pane carries the
                       whole popover — keep the bounds readable */
                    minWidth: { xs: 260, sm: 0 },
                    p: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1.75,
                }}>
                <OperatorSelect
                    operator={draft.operator}
                    operators={DATE_OPERATORS}
                    onChange={(operator) =>
                        setDraft({
                            ...draft,
                            operator,
                            value: valueForOperator(draft.value, operator),
                        })
                    }
                />

                {isRange ? (
                    <Box
                        sx={{
                            display: 'grid',
                            /* minmax(0, …): a picker's min-content width must
                               not widen its track past the popover */
                            gridTemplateColumns: {
                                xs: 'minmax(0, 1fr)',
                                sm: 'minmax(0, 1fr) minmax(0, 1fr)',
                            },
                            gap: 1.5,
                        }}>
                        {renderPicker(
                            range.start,
                            t('table:table.from', 'From'),
                            (next) =>
                                setDraft({
                                    ...draft,
                                    value: { ...range, start: next },
                                }),
                            startRef,
                        )}
                        {renderPicker(
                            range.end,
                            t('table:table.to', 'To'),
                            (next) =>
                                setDraft({
                                    ...draft,
                                    value: { ...range, end: next },
                                }),
                        )}
                    </Box>
                ) : (
                    /* the condition is stated above the field now, so the
                       field itself only has to say what it holds */
                    renderPicker(
                        draft.value,
                        t('table:table.value', 'Value'),
                        (next) => setDraft({ ...draft, value: next }),
                        startRef,
                    )
                )}

                {timeAvailable && (
                    <Box
                        sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Switch
                            size='small'
                            checked={time}
                            onChange={toggleTime}
                        />
                        <Typography
                            variant='body2'
                            sx={{
                                fontSize: '0.8125rem',
                                color: time ? 'text.primary' : 'text.secondary',
                                cursor: 'pointer',
                            }}
                            onClick={toggleTime}>
                            {t('table:table.specify_time', 'Specify the time')}
                        </Typography>
                    </Box>
                )}

                <EditorFooter
                    secondaryLabel={t('table:table.reset', 'Reset')}
                    onSecondary={() =>
                        setDraft({
                            ...draft,
                            value: emptyValueFor(draft.value),
                        })
                    }
                    onApply={() => {
                        onApply({
                            value: draft.value,
                            operator: draft.operator,
                        });
                        onClose();
                    }}
                />
            </Box>
        </Box>
    );
};
