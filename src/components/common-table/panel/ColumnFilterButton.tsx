import FilterAltIcon from '@mui/icons-material/FilterAlt';
import FilterAltOutlinedIcon from '@mui/icons-material/FilterAltOutlined';
import { IconButton, Tooltip } from '@mui/material';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { columnSummary } from './column-summary';
import { FilterColumn } from './useFilterColumns';

type Props = {
    column: FilterColumn;
    disabled?: boolean;
    /** this column is the one whose editor is on screen */
    open?: boolean;
    onOpen: (anchor: HTMLElement) => void;
};

/** The way into a column's filter: one icon in the column's own header, so a
 *  filter is set where the column is, instead of through a list of every
 *  column the table has.
 */
export const ColumnFilterButton: React.FC<Props> = ({
    column,
    disabled,
    open,
    onOpen,
}) => {
    const { t, i18n } = useTranslation();

    const summary = useMemo(
        () =>
            columnSummary(column, {
                locale: i18n.language,
                operatorLabel: (op) => t(`table:table.${op}`, op),
                boolLabel: (v) => t(`table:table.${v}`, String(v)),
                countLabel: (count) =>
                    t('table:table.selected_count', {
                        count,
                        defaultValue: '{{count}} selected',
                    }),
                moreLabel: (count) => t('table:table.more_count', { count }),
            }),
        [column, i18n.language, t],
    );

    const tip = summary
        ? `${column.title}: ${summary}`
        : t('table:table.filter', 'Filter');

    return (
        <Tooltip title={tip} placement='top'>
            <span style={{ display: 'inline-flex' }}>
                <IconButton
                    size='small'
                    disabled={disabled}
                    aria-label={tip}
                    /* the header cell sorts on click and starts a resize on
                       mousedown — neither is what the icon was aimed at */
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                        e.stopPropagation();
                        onOpen(e.currentTarget);
                    }}
                    sx={{
                        p: '2px',
                        flexShrink: 0,
                        color: column.active ? 'primary.main' : 'text.disabled',
                        /* an untouched column keeps the icon faint: it is
                           there to be found, not to compete with the name of
                           the column it sits next to */
                        opacity: column.active || open ? 1 : 0.6,
                        '&:hover': {
                            opacity: 1,
                            color: column.active
                                ? 'primary.dark'
                                : 'text.secondary',
                        },
                    }}>
                    {column.active ? (
                        <FilterAltIcon sx={{ fontSize: 16 }} />
                    ) : (
                        <FilterAltOutlinedIcon sx={{ fontSize: 16 }} />
                    )}
                </IconButton>
            </span>
        </Tooltip>
    );
};
