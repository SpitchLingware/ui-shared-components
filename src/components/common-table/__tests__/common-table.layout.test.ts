import { describe, expect, it } from 'vitest';
import { resolveLayoutWidths } from '../common-table.layout';
import { TableField } from '../types';

const field = (over: Partial<TableField> & { field: string }): TableField =>
    ({ type: 'text', ...over }) as TableField;

const FIELDS: Array<TableField> = [
    field({ field: '_id', width: 70 }),
    field({ field: 'name', stretch: true }),
    field({ field: 'tags' }),
];

const widthsOf = (result: Record<string, number>) =>
    Object.fromEntries(
        Object.entries(result).map(([key, value]) => [key, Math.round(value)]),
    );

describe('resolveLayoutWidths', () => {
    it('leaves the columns alone when they already fill the space', () => {
        expect(
            widthsOf(
                resolveLayoutWidths({
                    fields: FIELDS,
                    widths: {},
                    availableWidth: 200,
                    hasUserResized: false,
                }),
            ),
        ).toEqual({ _id: 70, name: 160, tags: 160 });
    });

    it('hands the whole leftover to the stretch column', () => {
        /* 70 + 160 + 160 = 390, so 610 is left over */
        expect(
            widthsOf(
                resolveLayoutWidths({
                    fields: FIELDS,
                    widths: {},
                    availableWidth: 1000,
                    hasUserResized: false,
                }),
            ),
        ).toEqual({ _id: 70, name: 770, tags: 160 });
    });

    /* what the old grid's `flex: 1` did: a column pinned by the config keeps its width */
    it('shares the leftover between the unpinned columns when none asked to stretch', () => {
        const fields = [
            field({ field: '_id', width: 70 }),
            field({ field: 'name' }),
            field({ field: 'tags' }),
        ];
        expect(
            widthsOf(
                resolveLayoutWidths({
                    fields,
                    widths: {},
                    availableWidth: 1000,
                    hasUserResized: false,
                }),
            ),
        ).toEqual({ _id: 70, name: 465, tags: 465 });
    });

    /**
     * A button column holds a control of its own size, so widening it only pushes that control
     * into empty space. The old grid excluded those columns from its autosize pass for the same
     * reason - and a column that explicitly asks to stretch still gets to.
     */
    it('leaves a column of buttons out of the leftover, unless it asked for it', () => {
        const fields = [
            field({ field: 'name' }),
            field({ field: 'run', type: 'action', minWidth: 72 }),
        ];
        expect(
            widthsOf(
                resolveLayoutWidths({
                    fields,
                    widths: {},
                    availableWidth: 1000,
                    hasUserResized: false,
                }),
            ),
        ).toEqual({ name: 840, run: 160 });

        expect(
            widthsOf(
                resolveLayoutWidths({
                    fields: [fields[0], field({ ...fields[1], stretch: true })],
                    widths: {},
                    availableWidth: 1000,
                    hasUserResized: false,
                }),
            ),
        ).toEqual({ name: 160, run: 840 });
    });

    it('splits the leftover between several stretch columns', () => {
        const fields = [
            field({ field: 'a', stretch: true }),
            field({ field: 'b', stretch: true }),
        ];
        expect(
            widthsOf(
                resolveLayoutWidths({
                    fields,
                    widths: {},
                    availableWidth: 1000,
                    hasUserResized: false,
                }),
            ),
        ).toEqual({ a: 500, b: 500 });
    });

    /**
     * Once the widths are the user's own, the stretch column stops swallowing the space: it is
     * shared in the proportion they left, so their ratios survive a window resize.
     */
    it('shares proportionally once the user has resized a column', () => {
        expect(
            widthsOf(
                resolveLayoutWidths({
                    fields: FIELDS,
                    widths: { _id: 100, name: 200, tags: 100 },
                    availableWidth: 800,
                    hasUserResized: true,
                }),
            ),
        ).toEqual({ _id: 200, name: 400, tags: 200 });
    });

    it('never shrinks a column below its minimum while sharing', () => {
        const fields = [
            field({ field: 'a', width: 10, minWidth: 60 }),
            field({ field: 'b', width: 1000 }),
        ];
        const result = resolveLayoutWidths({
            fields,
            widths: {},
            availableWidth: 1200,
            hasUserResized: true,
        });
        expect(result.a).toBeGreaterThanOrEqual(60);
    });

    it('keeps the state width over the configured one', () => {
        expect(
            widthsOf(
                resolveLayoutWidths({
                    fields: FIELDS,
                    widths: { _id: 300 },
                    availableWidth: 100,
                    hasUserResized: true,
                }),
            )._id,
        ).toBe(300);
    });

    it('survives an unmeasured container', () => {
        expect(
            widthsOf(
                resolveLayoutWidths({
                    fields: FIELDS,
                    widths: {},
                    availableWidth: 0,
                    hasUserResized: false,
                }),
            ),
        ).toEqual({ _id: 70, name: 160, tags: 160 });
    });
});
