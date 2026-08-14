import { TableField } from './types';

export const DEFAULT_COL_WIDTH = 160;
export const CONTROL_COL_WIDTH = 44;
export const MIN_COL_WIDTH = 60;

export type ColumnWidths = Record<string, number>;

export type ResolveLayoutWidthsParams = {
    fields: Array<TableField>;
    /** the width each column carries in state, before any of this */
    widths: ColumnWidths;
    /** the space the columns have to share, i.e. the container minus the control columns */
    availableWidth: number;
    /** true once the user has dragged a column edge, here or in an earlier session */
    hasUserResized: boolean;
};

/**
 * How wide each column is actually drawn.
 *
 * Below the available width nothing changes and the table scrolls sideways. Above it the
 * leftover has to go somewhere, and where it goes is the whole point:
 *
 * - before the user has resized anything, it goes to the columns marked `stretch`, or - where
 *   none is marked - to every column the config did not pin to a width. That reproduces the old
 *   grid's `flex: 1`, and is why an id column pinned to 70px stays 70px however wide the window
 *   gets. A column of buttons is never picked for this: it holds a control of its own size, and
 *   growing it leaves that control adrift in empty space.
 * - from the first resize on, the widths on screen are the user's own, so the space is shared
 *   in their proportion instead and their ratios survive a window resize.
 */
export const resolveLayoutWidths = ({
    fields,
    widths,
    availableWidth,
    hasUserResized,
}: ResolveLayoutWidthsParams): ColumnWidths => {
    const base: ColumnWidths = {};
    fields.forEach((field) => {
        base[field.field] =
            widths[field.field] ?? field.width ?? DEFAULT_COL_WIDTH;
    });

    const total = fields.reduce((sum, field) => sum + base[field.field], 0);
    if (!fields.length || availableWidth <= total || total <= 0) {
        return base;
    }

    if (!hasUserResized) {
        const stretchFields = fields.filter((field) => field.stretch);
        const flexible = stretchFields.length
            ? stretchFields
            : fields.filter(
                  (field) =>
                      field.width === undefined && field.type !== 'action',
              );

        if (flexible.length) {
            const share = (availableWidth - total) / flexible.length;
            const next = { ...base };
            flexible.forEach((field) => {
                next[field.field] = base[field.field] + share;
            });
            return next;
        }
    }

    const next: ColumnWidths = {};
    fields.forEach((field) => {
        next[field.field] = Math.max(
            field.minWidth ?? MIN_COL_WIDTH,
            (base[field.field] * availableWidth) / total,
        );
    });
    return next;
};
