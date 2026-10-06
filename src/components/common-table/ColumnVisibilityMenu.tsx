import {
    Box,
    Button,
    Checkbox,
    Divider,
    ListItemButton,
    Popover,
    Typography,
} from '@mui/material';
import React, { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { columnTitleKey, hideableFields } from './column-visibility.utils';
import { TableField } from './types';

type Props = {
    anchorEl: HTMLElement | null;
    onClose: () => void;
    elementType: string;
    fields: Array<TableField>;
    hidden: Array<string>;
    onToggle: (field: string) => void;
    onShowAll: () => void;
    note?: ReactNode;
};

const LIST_MAX_HEIGHT = 360;

export const ColumnVisibilityMenu: React.FC<Props> = ({
    anchorEl,
    onClose,
    elementType,
    fields,
    hidden,
    onToggle,
    onShowAll,
    note,
}) => {
    const { t } = useTranslation();
    const options = hideableFields(fields);
    const visibleCount = options.filter(
        (f) => !hidden.includes(f.field),
    ).length;

    return (
        <Popover
            open={Boolean(anchorEl)}
            anchorEl={anchorEl}
            onClose={onClose}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}>
            <Box
                sx={{
                    p: 1.5,
                    width: 280,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1,
                }}>
                <Typography variant='subtitle2'>
                    {t('table:table.columns', 'Columns')}
                </Typography>
                <Box sx={{ maxHeight: LIST_MAX_HEIGHT, overflowY: 'auto' }}>
                    {options.map((field) => {
                        const shown = !hidden.includes(field.field);
                        const locked = shown && visibleCount <= 1;
                        const { key, fallback } = columnTitleKey(
                            elementType,
                            field,
                        );
                        return (
                            <ListItemButton
                                key={field.field}
                                dense
                                disabled={locked}
                                onClick={() => onToggle(field.field)}
                                sx={{ px: 0, py: '2px', borderRadius: 1 }}>
                                <Checkbox
                                    size='small'
                                    tabIndex={-1}
                                    disableRipple
                                    checked={shown}
                                    sx={{ p: 0.5, mr: 1 }}
                                />
                                <Typography
                                    variant='body2'
                                    sx={{
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                    }}>
                                    {t(key, fallback)}
                                </Typography>
                            </ListItemButton>
                        );
                    })}
                </Box>
                <Divider />
                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <Button
                        size='small'
                        color='inherit'
                        disabled={hidden.length === 0}
                        onClick={onShowAll}>
                        {t('table:table.columns_show_all', 'Show all')}
                    </Button>
                </Box>
                {note && (
                    <Typography
                        variant='caption'
                        sx={{ color: 'text.secondary' }}>
                        {note}
                    </Typography>
                )}
            </Box>
        </Popover>
    );
};
