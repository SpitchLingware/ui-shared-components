import moment, { Moment } from 'moment-timezone';
import { CommonTableV2FilterValue } from '../types';
import {
    boundHasTime,
    parseBound,
    withTimeFormat,
} from '../filters/date-filter.utils';
import {
    FilterSummaryParts,
    isRangeValue,
    joinSummary,
    VALUELESS_OPERATORS,
} from './filter-value.utils';

export type QuickRangeId =
    | 'today'
    | 'yesterday'
    | 'last_7_days'
    | 'last_30_days'
    | 'custom';

export const QUICK_RANGES: Array<QuickRangeId> = [
    'today',
    'yesterday',
    'last_7_days',
    'last_30_days',
    'custom',
];

export type PeriodBounds = { start: string; end: string };

type Window = { start: Moment; end: Moment };

const windowFor = (id: QuickRangeId, timezone: string): Window | undefined => {
    const today = moment.tz(timezone).startOf('day');
    switch (id) {
        case 'today':
            return { start: today.clone(), end: today.clone() };
        case 'yesterday': {
            const day = today.clone().subtract(1, 'day');
            return { start: day, end: day.clone() };
        }
        case 'last_7_days':
            return { start: today.clone().subtract(6, 'days'), end: today };
        case 'last_30_days':
            return { start: today.clone().subtract(29, 'days'), end: today };
        default:
            return undefined;
    }
};

/** The bounds a quick pick writes into the «От» / «До» fields.
 *
 *  With the time switch off the day itself is the bound and the backend
 *  widens it to the whole day; with it on the day is spelled out edge to
 *  edge, because a precise bound is compared as it stands.
 */
export const quickRangeBounds = (
    id: QuickRangeId,
    timezone: string,
    format: string,
    withTime: boolean,
): PeriodBounds | undefined => {
    const window = windowFor(id, timezone);
    if (!window) return undefined;

    if (!withTime) {
        return {
            start: window.start.format(format),
            end: window.end.format(format),
        };
    }

    const target = withTimeFormat(format);
    return {
        start: window.start.startOf('day').format(target),
        end: window.end.endOf('day').format(target),
    };
};

export const detectQuickRange = (
    filter: CommonTableV2FilterValue,
    timezone: string,
    format: string,
    withTime: boolean,
): QuickRangeId => {
    if (filter.operator !== 'inrange' || !isRangeValue(filter.value)) {
        return 'custom';
    }
    const { start, end } = filter.value;
    const match = QUICK_RANGES.find((id) => {
        const bounds = quickRangeBounds(id, timezone, format, withTime);
        return bounds && bounds.start === start && bounds.end === end;
    });
    return match ?? 'custom';
};

export type PeriodLabelOptions = {
    format: string;
    timezone: string;
    locale?: string;
    /** short form for the narrow layout: «28.07 — 14.08» */
    compact?: boolean;
    operatorLabel: (operator: string) => string;
    emptyLabel: string;
};

const readBound = (
    raw: any,
    format: string,
    timezone: string,
): Moment | undefined => parseBound(raw, format, timezone) ?? undefined;

const formatBound = (
    value: Moment,
    options: PeriodLabelOptions,
    withYear: boolean,
    withTime: boolean,
): string => {
    const { locale, compact } = options;
    const shaped = locale ? value.clone().locale(locale) : value;
    if (compact) return shaped.format(withTime ? 'DD.MM HH:mm' : 'DD.MM');
    const day = shaped.format(withYear ? 'D MMM YYYY' : 'D MMM');
    return withTime ? `${day} ${shaped.format('HH:mm')}` : day;
};

/** What a period says, operator apart from value.
 *
 *  A window is named as well as spelled out: «1 авг — 14 авг» carries the two
 *  days but not whether the rows inside them are the ones kept or the ones
 *  thrown away, and one filled bound out of two reads as a single day.
 */
export const periodParts = (
    filter: CommonTableV2FilterValue | undefined,
    options: PeriodLabelOptions,
): FilterSummaryParts => {
    const { format, timezone, emptyLabel, operatorLabel } = options;
    const empty = { operator: '', value: emptyLabel };
    if (!filter) return empty;

    const operator = operatorLabel(filter.operator);

    if (VALUELESS_OPERATORS.has(filter.operator)) {
        return { operator, value: '' };
    }

    if (filter.operator === 'inrange' || filter.operator === 'notinrange') {
        if (!isRangeValue(filter.value)) return empty;
        const start = readBound(filter.value.start, format, timezone);
        const end = readBound(filter.value.end, format, timezone);
        if (!start && !end) return empty;

        const time =
            boundHasTime(filter.value.start, format, timezone) ||
            boundHasTime(filter.value.end, format, timezone);

        if (start && end) {
            const sameYear = start.year() === end.year();
            return {
                operator,
                value:
                    `${formatBound(start, options, !sameYear, time)} — ` +
                    formatBound(end, options, true, time),
            };
        }
        const single = (start ?? end) as Moment;
        return { operator, value: formatBound(single, options, true, time) };
    }

    const bound = readBound(filter.value, format, timezone);
    if (!bound) return empty;
    const time = boundHasTime(filter.value, format, timezone);
    return { operator, value: formatBound(bound, options, true, time) };
};

/** What the period button says. */
export const periodLabel = (
    filter: CommonTableV2FilterValue | undefined,
    options: PeriodLabelOptions,
): string => joinSummary(periodParts(filter, options));
