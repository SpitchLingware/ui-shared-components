/** The type styles the filter editors share: the name of the column at the
 *  top, the heading of a section under it, and the label of a single field.
 *  Both editors are one popover to the user, so they read from the same
 *  sheet.
 */
export const titleSx = {
    fontSize: '0.8125rem',
    fontWeight: 600,
    color: 'text.primary',
};

export const overlineSx = {
    fontSize: '0.6875rem',
    fontWeight: 600,
    letterSpacing: '.04em',
    textTransform: 'uppercase' as const,
    color: 'text.secondary',
};

export const labelSx = { fontSize: '0.75rem', fontWeight: 500 };
