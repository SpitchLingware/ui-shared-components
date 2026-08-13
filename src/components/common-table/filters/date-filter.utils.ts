import moment, { Moment } from 'moment-timezone';

/* A date bound may name a calendar DAY ("2026-07-15") or an INSTANT ("2026-07-15 14:30"). Which of
 * the two it is has to survive a round trip through the table's stored filter state, so it is read
 * back off the value itself rather than kept beside it: a filter restored from storage shows the
 * clock already switched on when its bounds carry a time.
 *
 * The backend reads both spellings; a bound with a time skips the day arithmetic there (`after`
 * means "from this instant", not "from the next day"). Sending a time it cannot parse is worse than
 * not sending one — the time is dropped silently and the list looks filtered when it is not. */

/** the time-precise spelling of a date format — the same format with minutes appended */
export const withTimeFormat = (format: string): string => `${format} HH:mm`;

const parse = (
    raw: string,
    format: string,
    timezone: string,
): Moment | null => {
    const parsed = moment.tz(raw, format, true, timezone);
    return parsed.isValid() ? parsed : null;
};

/** does this single bound name an instant rather than a day? */
export const boundHasTime = (
    raw: any,
    format: string,
    timezone: string,
): boolean =>
    typeof raw === 'string' &&
    raw.length > 0 &&
    parse(raw, withTimeFormat(format), timezone) !== null;

/** does the filter's value — a single bound or a range — name instants? */
export const valueHasTime = (
    value: any,
    format: string,
    timezone: string,
): boolean => {
    if (value && typeof value === 'object') {
        return (
            boundHasTime(value.start, format, timezone) ||
            boundHasTime(value.end, format, timezone)
        );
    }
    return boundHasTime(value, format, timezone);
};

/**
 * Rewrite a bound into the other spelling, keeping the day it names.
 *
 * Switching the clock ON puts the bound at the START of its day rather than at "now": a range the
 * operator has already narrowed must not jump when they ask for more precision — they are about to
 * type the time anyway, and midnight is the bound that changes nothing.
 */
export const convertBound = (
    raw: any,
    format: string,
    timezone: string,
    time: boolean,
): string => {
    if (typeof raw !== 'string' || raw.length === 0) return '';

    const target = time ? withTimeFormat(format) : format;
    const parsed =
        parse(raw, withTimeFormat(format), timezone) ??
        parse(raw, format, timezone);

    if (!parsed) return '';

    return parsed.format(target);
};

/** the same, for a filter value that may be a range */
export const convertValue = (
    value: any,
    format: string,
    timezone: string,
    time: boolean,
): any => {
    if (value && typeof value === 'object') {
        return {
            ...value,
            start: convertBound(value.start, format, timezone, time),
            end: convertBound(value.end, format, timezone, time),
        };
    }
    return convertBound(value, format, timezone, time);
};
