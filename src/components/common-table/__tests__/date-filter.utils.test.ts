import { describe, expect, it } from 'vitest';
import {
    boundHasTime,
    convertBound,
    convertValue,
    parseBound,
    valueHasTime,
    withTimeFormat,
} from '../filters/date-filter.utils';

const FORMAT = 'YYYY-MM-DD';
const TZ = 'Europe/Moscow';

describe('reading the spelling back off a bound', () => {
    it('a day is a day and an instant is an instant', () => {
        expect(boundHasTime('2026-07-15', FORMAT, TZ)).toBe(false);
        expect(boundHasTime('2026-07-15 14:30', FORMAT, TZ)).toBe(true);
    });

    it('an empty or unparseable bound names neither', () => {
        for (const raw of ['', undefined, null, 'вчера', 42, {}]) {
            expect(boundHasTime(raw, FORMAT, TZ)).toBe(false);
        }
    });

    it('a range names instants when either of its bounds does', () => {
        expect(valueHasTime({ start: '2026-07-15', end: '' }, FORMAT, TZ)).toBe(
            false,
        );
        expect(
            valueHasTime({ start: '2026-07-15 09:00', end: '' }, FORMAT, TZ),
        ).toBe(true);
        expect(
            valueHasTime({ start: '', end: '2026-07-15 18:00' }, FORMAT, TZ),
        ).toBe(true);
    });

    it('the time-precise spelling of a format is the format plus minutes', () => {
        expect(withTimeFormat(FORMAT)).toBe('YYYY-MM-DD HH:mm');
    });
});

describe('reading a bound back for the picker', () => {
    it('an instant is read in the zone it was written in, not the local one', () => {
        const parsed = parseBound('2026-07-15 14:30', FORMAT, TZ);

        expect(parsed?.tz(TZ).format('YYYY-MM-DD HH:mm')).toBe(
            '2026-07-15 14:30',
        );
    });

    it('a day is midnight of that day in the same zone', () => {
        const parsed = parseBound('2026-07-15', FORMAT, TZ);

        expect(parsed?.tz(TZ).format('YYYY-MM-DD HH:mm')).toBe(
            '2026-07-15 00:00',
        );
    });

    it('reading and re-writing a bound is a fixed point', () => {
        const raw = '2026-07-15 14:30';
        const once = parseBound(raw, FORMAT, TZ)!.format(withTimeFormat(FORMAT));
        const twice = parseBound(once, FORMAT, TZ)!.format(
            withTimeFormat(FORMAT),
        );

        expect(once).toBe(raw);
        expect(twice).toBe(raw);
    });

    it('an ISO instant is still understood', () => {
        const parsed = parseBound('2026-07-15T11:30:00.000Z', FORMAT, TZ);

        expect(parsed?.tz(TZ).format('YYYY-MM-DD HH:mm')).toBe(
            '2026-07-15 14:30',
        );
    });

    it('nothing at all is null rather than "now"', () => {
        for (const raw of ['', undefined, null, 'вчера', 42, {}]) {
            expect(parseBound(raw, FORMAT, TZ)).toBe(null);
        }
    });
});

describe('switching the clock on and off', () => {
    it('a day becomes the start of that day', () => {
        expect(convertBound('2026-07-15', FORMAT, TZ, true)).toBe(
            '2026-07-15 00:00',
        );
    });

    it('an instant goes back to being its own day', () => {
        expect(convertBound('2026-07-15 14:30', FORMAT, TZ, false)).toBe(
            '2026-07-15',
        );
    });

    it('converting to the spelling a bound already has changes nothing', () => {
        expect(convertBound('2026-07-15 14:30', FORMAT, TZ, true)).toBe(
            '2026-07-15 14:30',
        );
        expect(convertBound('2026-07-15', FORMAT, TZ, false)).toBe(
            '2026-07-15',
        );
    });

    it('an empty bound stays empty rather than becoming today', () => {
        expect(convertBound('', FORMAT, TZ, true)).toBe('');
        expect(convertBound(undefined, FORMAT, TZ, true)).toBe('');
    });

    it('an unparseable bound is dropped, not passed on to the backend', () => {
        expect(convertBound('вчера', FORMAT, TZ, true)).toBe('');
    });

    it('both ends of a range are converted, and nothing else about it', () => {
        const value = {
            start: '2026-07-15',
            end: '2026-07-16',
            keep: 'me',
        } as any;

        expect(convertValue(value, FORMAT, TZ, true)).toEqual({
            start: '2026-07-15 00:00',
            end: '2026-07-16 00:00',
            keep: 'me',
        });
    });

    it('a half-filled range keeps its empty half empty', () => {
        expect(
            convertValue({ start: '2026-07-15', end: '' }, FORMAT, TZ, true),
        ).toEqual({ start: '2026-07-15 00:00', end: '' });
    });

    it('switching on and off again returns the original bound', () => {
        const on = convertValue('2026-07-15', FORMAT, TZ, true);

        expect(convertValue(on, FORMAT, TZ, false)).toBe('2026-07-15');
    });
});
