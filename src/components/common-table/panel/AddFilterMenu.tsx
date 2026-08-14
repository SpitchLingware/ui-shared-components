import CheckIcon from '@mui/icons-material/Check';
import SearchIcon from '@mui/icons-material/Search';
import {
    Box,
    InputAdornment,
    ListItemButton,
    Popover,
    TextField,
    Typography,
} from '@mui/material';
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { TableField } from '../types';

export type AddFilterColumn = {
    field: TableField;
    title: string;
    /** already on the panel — listed, but not offered again */
    active: boolean;
};

type Props = {
    anchorEl: HTMLElement | null;
    columns: Array<AddFilterColumn>;
    onPick: (field: TableField) => void;
    onClose: () => void;
};

const SEARCH_THRESHOLD = 8;
const LIST_MAX_HEIGHT = 300;

export const AddFilterMenu: React.FC<Props> = ({
    anchorEl,
    columns,
    onPick,
    onClose,
}) => {
    const { t } = useTranslation();
    const [query, setQuery] = useState('');

    const shown = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return columns;
        return columns.filter((c) => c.title.toLowerCase().includes(q));
    }, [columns, query]);

    return (
        <Popover
            open={Boolean(anchorEl)}
            anchorEl={anchorEl}
            onClose={() => {
                setQuery('');
                onClose();
            }}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
            transformOrigin={{ vertical: 'top', horizontal: 'left' }}
            slotProps={{ paper: { sx: { mt: 0.5, width: 232, p: 1 } } }}>
            {columns.length > SEARCH_THRESHOLD && (
                <TextField
                    size='small'
                    fullWidth
                    autoFocus
                    value={query}
                    placeholder={t('table:table.search_column', 'Search')}
                    onChange={(e) => setQuery(e.target.value)}
                    slotProps={{
                        input: {
                            startAdornment: (
                                <InputAdornment position='start'>
                                    <SearchIcon sx={{ fontSize: 16 }} />
                                </InputAdornment>
                            ),
                        },
                    }}
                    sx={{ mb: 0.75 }}
                />
            )}
            <Box sx={{ maxHeight: LIST_MAX_HEIGHT, overflowY: 'auto' }}>
                {shown.length === 0 && (
                    <Typography
                        variant='body2'
                        sx={{ color: 'text.secondary', px: 1, py: 0.75 }}>
                        {t('table:table.noRecords', 'No records')}
                    </Typography>
                )}
                {shown.map((c) => (
                    <ListItemButton
                        key={c.field.field}
                        disabled={c.active}
                        onClick={() => {
                            setQuery('');
                            onPick(c.field);
                        }}
                        sx={{
                            py: '7px',
                            px: 1,
                            borderRadius: 1,
                            justifyContent: 'space-between',
                            gap: 1,
                        }}>
                        <Typography
                            variant='body2'
                            sx={{
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                            }}>
                            {c.title}
                        </Typography>
                        {c.active && (
                            <CheckIcon
                                sx={{ fontSize: 16, color: 'primary.main' }}
                            />
                        )}
                    </ListItemButton>
                ))}
            </Box>
        </Popover>
    );
};
