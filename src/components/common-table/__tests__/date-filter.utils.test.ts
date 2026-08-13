import { describe, expect, it } from 'vitest';
import {
    boundHasTime,
    convertBound,
    convertValue,
    valueHasTime,
    withTimeFormat,
} from '../filters/date-filter.utils';

/* The date filter's bounds are strings on the wire, and their SPELLING is what tells the backend
 * how to read them: "2026-07-15" is a calendar day, "2026-07-15 14:30" an instant. Everything here
 * is about not losing that distinction — the clock switch has to survive a reload, and turning it
 * on must not throw away the bounds the operator already picked. */

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

    /* what makes the switch come back on for a filter restored from the table's stored state */
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

describe('switching the clock on and off', () => {
    /* midnight, not "now": the operator is about to type the time, and a bound that moves on its
     * own would silently change the range they had already narrowed */
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

    /* the round trip: on, then off, and the operator is back where they started */
    it('switching on and off again returns the original bound', () => {
        const on = convertValue('2026-07-15', FORMAT, TZ, true);

        expect(convertValue(on, FORMAT, TZ, false)).toBe('2026-07-15');
    });
});
