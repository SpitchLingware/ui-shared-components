import ClearIcon from '@mui/icons-material/Clear';
import { Box, Button, useMediaQuery, useTheme } from '@mui/material';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { FilterChipItem } from './FilterChipItem';
import { FilterColumn } from './useFilterColumns';

type Props = {
    columns: Array<FilterColumn>;
    disabled?: boolean;
    onOpen: (column: FilterColumn, anchor: HTMLElement) => void;
    onRemove: (column: FilterColumn) => void;
    onResetAll: () => void;
};

/** What the table is currently narrowed down to, and the one button that
 *  undoes all of it.
 *
 *  Filters are set in the column headers, so the strip has nothing to offer
 *  while none of them is set — it stays out of the way until there is
 *  something to report.
 */
export const TableFilterPanel: React.FC<Props> = ({
    columns,
    disabled,
    onOpen,
    onRemove,
    onResetAll,
}) => {
    const { t } = useTranslation();
    const theme = useTheme();
    const narrow = useMediaQuery(theme.breakpoints.down('sm'));

    const active = columns.filter((c) => c.active);
    if (active.length === 0) return null;

    return (
        <Box
            sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                flexWrap: 'wrap',
                px: 2,
                pb: 1.5,
                pt: 1,
                borderBottom: '1px solid',
                borderColor: 'divider',
                bgcolor: 'background.paper',
            }}>
            {active.map((c) => (
                <FilterChipItem
                    key={c.field.field}
                    column={c}
                    disabled={disabled}
                    compact={narrow}
                    onOpen={(anchor) => onOpen(c, anchor)}
                    onDelete={() => onRemove(c)}
                />
            ))}

            {/* the reset follows the chips instead of being pushed to the far
                edge — on a wide table `ml: 'auto'` put it half a screen away
                from the thing it resets, and once the row wrapped it was left
                alone on a second line */}
            <Box
                sx={{
                    width: '1px',
                    height: 20,
                    flexShrink: 0,
                    bgcolor: 'divider',
                    display: { xs: 'none', sm: 'block' },
                }}
            />
            <Button
                size='small'
                color='inherit'
                disabled={disabled}
                onClick={onResetAll}
                startIcon={<ClearIcon sx={{ fontSize: 16 }} />}
                sx={{
                    height: 26,
                    px: 1,
                    flexShrink: 0,
                    fontSize: '0.75rem',
                    fontWeight: 400,
                    textTransform: 'none',
                    whiteSpace: 'nowrap',
                    color: 'text.secondary',
                    '& .MuiButton-startIcon': { mr: 0.5 },
                    /* it throws work away, so it reads as destructive the
                       moment the pointer is on it */
                    '&:hover': {
                        color: 'error.main',
                        bgcolor: 'error.lighter',
                    },
                }}>
                {t('table:table.reset_count', {
                    n: active.length,
                    defaultValue: 'Reset ({{n}})',
                })}
            </Button>
        </Box>
    );
};
