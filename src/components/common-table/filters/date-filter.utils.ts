import moment, { Moment } from 'moment-timezone';

export const withTimeFormat = (format: string): string => `${format} HH:mm`;

const parse = (
    raw: string,
    format: string,
    timezone: string,
): Moment | null => {
    const parsed = moment.tz(raw, format, true, timezone);
    return parsed.isValid() ? parsed : null;
};

export const parseBound = (
    raw: any,
    format: string,
    timezone: string,
): Moment | null => {
    if (typeof raw !== 'string' || raw.length === 0) return null;

    const known =
        parse(raw, withTimeFormat(format), timezone) ??
        parse(raw, format, timezone);
    if (known) return known;

    const free = moment(raw).tz(timezone);
    return free.isValid() ? free : null;
};

export const boundHasTime = (
    raw: any,
    format: string,
    timezone: string,
): boolean =>
    typeof raw === 'string' &&
    raw.length > 0 &&
    parse(raw, withTimeFormat(format), timezone) !== null;

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

export const convertBound = (
    raw: any,
    format: string,
    timezone: string,
    time: boolean,
): string => {
    if (typeof raw !== 'string' || raw.length === 0) return '';

    const target = time ? withTimeFormat(format) : format;
    const parsed = parseBound(raw, format, timezone);

    if (!parsed) return '';

    return parsed.format(target);
};

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
