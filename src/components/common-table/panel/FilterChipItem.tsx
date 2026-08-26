import { Box, Chip, ChipProps, Tooltip } from '@mui/material';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { columnSummary } from './column-summary';
import { isOptionField } from './filter-value.utils';
import { useOptionLabel } from './useFilterOptions';
import { FilterColumn } from './useFilterColumns';

type Props = {
    column: FilterColumn;
    disabled?: boolean;
    /** short form for the narrow layout */
    compact?: boolean;
    onOpen: (anchor: HTMLElement) => void;
    onDelete: () => void;
};

export const FilterChipItem: React.FC<Props> = ({
    column,
    disabled,
    compact,
    onOpen,
    onDelete,
}) => {
    const { t, i18n } = useTranslation();
    const { field, setting, title } = column;

    const optionLabel = useOptionLabel(
        isOptionField(field) ? setting.filterProps?.dataSource : undefined,
    );

    const summary = columnSummary(column, {
        locale: i18n.language,
        compact,
        optionLabel,
        operatorLabel: (op) => t(`table:table.${op}`, op),
        boolLabel: (v) => t(`table:table.${v}`, String(v)),
        moreLabel: (count) => t('table:table.more_count', { count }),
    });

    return (
        <Tooltip title={`${title}: ${summary}`} placement='top'>
            <Chip
                size='small'
                color='primary'
                variant={'light' as ChipProps['variant']}
                disabled={disabled}
                onClick={(e) => onOpen(e.currentTarget as HTMLElement)}
                onDelete={onDelete}
                sx={{
                    height: 26,
                    maxWidth: 320,
                    borderRadius: 1,
                    bgcolor: 'primary.lighter',
                    color: 'primary.main',
                    '& .MuiChip-deleteIcon': { fontSize: 14, opacity: 0.7 },
                }}
                label={
                    <Box
                        component='span'
                        sx={{
                            display: 'inline-flex',
                            gap: '4px',
                            maxWidth: '100%',
                        }}>
                        <Box component='span' sx={{ color: 'primary.400' }}>
                            {title}:
                        </Box>
                        <Box
                            component='span'
                            sx={{
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                            }}>
                            {summary}
                        </Box>
                    </Box>
                }
            />
        </Tooltip>
    );
};
