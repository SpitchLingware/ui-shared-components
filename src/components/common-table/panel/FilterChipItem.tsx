import { Box, Chip, ChipProps, Tooltip } from '@mui/material';
import React from 'react';
import { useTranslation } from 'react-i18next';
import {
    CommonTableV2ColumnSettings,
    CommonTableV2FilterValue,
    TableField,
} from '../types';
import { describeFilterValue, isOptionField } from './filter-value.utils';
import { useOptionLabel } from './useFilterOptions';

type Props = {
    field: TableField;
    setting: CommonTableV2ColumnSettings;
    filter: CommonTableV2FilterValue;
    title: string;
    disabled?: boolean;
    onOpen: (anchor: HTMLElement) => void;
    onDelete: () => void;
};

export const FilterChipItem: React.FC<Props> = ({
    field,
    setting,
    filter,
    title,
    disabled,
    onOpen,
    onDelete,
}) => {
    const { t } = useTranslation();
    const optionLabel = useOptionLabel(
        isOptionField(field) ? setting.filterProps?.dataSource : undefined,
    );

    const summary = describeFilterValue(filter, {
        operatorLabel: (op) => t(`table:table.${op}`, op),
        optionLabel,
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
