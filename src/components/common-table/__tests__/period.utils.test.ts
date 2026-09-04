import moment from 'moment-timezone';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
    detectQuickRange,
    periodLabel,
    periodParts,
    quickRangeBounds,
} from '../panel/period.utils';
import { CommonTableV2FilterValue } from '../types';

const FORMAT = 'YYYY-MM-DD';
const TZ = 'Europe/Moscow';
const operatorLabel = (op: string) => `op:${op}`;

const range = (start: string, end: string): CommonTableV2FilterValue => ({
    name: 'start_time',
    type: 'date',
    operator: 'inrange',
    value: { start, end },
});

describe('the days a quick pick stands for', () => {
    beforeEach(() => {
        /* «сегодня» is a moving target; pin it to a day that is not a month
           or a year boundary so the arithmetic is readable */
        moment.now = () => Date.parse('2026-08-14T09:20:00+03:00');
    });
    afterEach(() => {
        moment.now = () => Date.now();
    });

    it('names the whole of today, and of yesterday', () => {
        expect(quickRangeBounds('today', TZ, FORMAT, false)).toEqual({
            start: '2026-08-14',
            end: '2026-08-14',
        });
        expect(quickRangeBounds('yesterday', TZ, FORMAT, false)).toEqual({
            start: '2026-08-13',
            end: '2026-08-13',
        });
    });

    it('counts the last 7 days inclusive of today', () => {
        expect(quickRangeBounds('last_7_days', TZ, FORMAT, false)).toEqual({
            start: '2026-08-08',
            end: '2026-08-14',
        });
        expect(quickRangeBounds('last_30_days', TZ, FORMAT, false)).toEqual({
            start: '2026-07-16',
            end: '2026-08-14',
        });
    });

    it('spells the day out edge to edge once the time is precise', () => {
        expect(quickRangeBounds('today', TZ, FORMAT, true)).toEqual({
            start: '2026-08-14 00:00',
            end: '2026-08-14 23:59',
        });
    });

    it('«произвольный» is the absence of a window, not a window', () => {
        expect(quickRangeBounds('custom', TZ, FORMAT, false)).toBeUndefined();
    });

    it('reads its own writing back', () => {
        const bounds = quickRangeBounds('last_7_days', TZ, FORMAT, false)!;
        expect(
            detectQuickRange(
                range(bounds.start, bounds.end),
                TZ,
                FORMAT,
                false,
            ),
        ).toBe('last_7_days');
    });

    it('anything else is «произвольный»', () => {
        expect(
            detectQuickRange(
                range('2026-01-01', '2026-02-02'),
                TZ,
                FORMAT,
                false,
            ),
        ).toBe('custom');
        expect(
            detectQuickRange(
                {
                    name: 'x',
                    type: 'date',
                    operator: 'before',
                    value: '2026-08-14',
                },
                TZ,
                FORMAT,
                false,
            ),
        ).toBe('custom');
    });
});

describe('what the period button says', () => {
    const options = {
        format: FORMAT,
        timezone: TZ,
        locale: 'en',
        operatorLabel,
        emptyLabel: 'Период',
    };

    it('falls back to the column name when nothing is picked', () => {
        expect(periodLabel(undefined, options)).toBe('Период');
        expect(periodLabel(range('', ''), options)).toBe('Период');
    });

    it('drops the repeated year and keeps the last one', () => {
        expect(periodLabel(range('2026-07-28', '2026-08-14'), options)).toBe(
            'op:inrange 28 Jul — 14 Aug 2026',
        );
    });

    it('keeps both years when the window crosses one', () => {
        expect(periodLabel(range('2025-12-28', '2026-01-14'), options)).toBe(
            'op:inrange 28 Dec 2025 — 14 Jan 2026',
        );
    });

    it('shows the time only when the bound names one', () => {
        expect(
            periodLabel(range('2026-07-28 15:37', '2026-08-14 23:59'), options),
        ).toBe('op:inrange 28 Jul 15:37 — 14 Aug 2026 23:59');
    });

    it('names the operator of a one-sided window too', () => {
        expect(
            periodLabel(
                {
                    name: 'x',
                    type: 'date',
                    operator: 'before',
                    value: '2026-08-14',
                },
                options,
            ),
        ).toBe('op:before 14 Aug 2026');
    });

    it('shortens to day and month on a narrow screen', () => {
        expect(
            periodLabel(range('2026-07-28', '2026-08-14'), {
                ...options,
                compact: true,
            }),
        ).toBe('op:inrange 28.07 — 14.08');
    });
});

describe('the two halves a period is drawn from', () => {
    const options = {
        format: FORMAT,
        timezone: TZ,
        locale: 'en',
        operatorLabel,
        emptyLabel: 'Период',
    };

    it('hands the condition over apart from the days it applies to', () => {
        expect(periodParts(range('2026-07-28', '2026-08-14'), options)).toEqual(
            { operator: 'op:inrange', value: '28 Jul — 14 Aug 2026' },
        );
    });

    it('leaves the operator out where there is no period to qualify', () => {
        expect(periodParts(range('', ''), options)).toEqual({
            operator: '',
            value: 'Период',
        });
    });
});
