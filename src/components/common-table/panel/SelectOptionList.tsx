import SearchIcon from '@mui/icons-material/Search';
import {
    Box,
    Checkbox,
    CircularProgress,
    InputAdornment,
    ListItemButton,
    TextField,
    Typography,
} from '@mui/material';
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { OptionSource, useFilterOptions } from './useFilterOptions';

type Props = {
    source: OptionSource;
    value: Array<string>;
    onChange: (next: Array<string>) => void;
};

/* below this many options the search box is noise rather than help */
const SEARCH_THRESHOLD = 10;
const LIST_MAX_HEIGHT = 240;

export const SelectOptionList: React.FC<Props> = ({
    source,
    value,
    onChange,
}) => {
    const { t } = useTranslation();
    const { options, loading } = useFilterOptions(source);
    const [query, setQuery] = useState('');

    const shown = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return options;
        return options.filter(
            (o) =>
                o.label.toLowerCase().includes(q) ||
                o.id.toLowerCase().includes(q),
        );
    }, [options, query]);

    const toggle = (id: string) => {
        onChange(
            value.includes(id)
                ? value.filter((v) => v !== id)
                : [...value, id],
        );
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {options.length > SEARCH_THRESHOLD && (
                <TextField
                    size='small'
                    autoFocus
                    value={query}
                    placeholder={t('table:table.search_value', 'Search')}
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
                />
            )}
            {loading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                    <CircularProgress size={20} />
                </Box>
            )}
            {!loading && shown.length === 0 && (
                <Typography variant='body2' sx={{ color: 'text.secondary' }}>
                    {t('table:table.noRecords', 'No records')}
                </Typography>
            )}
            <Box sx={{ maxHeight: LIST_MAX_HEIGHT, overflowY: 'auto' }}>
                {shown.map((o) => (
                    <ListItemButton
                        key={o.id}
                        dense
                        onClick={() => toggle(o.id)}
                        sx={{ px: 0, py: '2px', borderRadius: 1 }}>
                        <Checkbox
                            size='small'
                            tabIndex={-1}
                            disableRipple
                            checked={value.includes(o.id)}
                            sx={{ p: 0.5, mr: 1 }}
                        />
                        <Typography
                            variant='body2'
                            sx={{
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                            }}>
                            {o.label}
                        </Typography>
                    </ListItemButton>
                ))}
            </Box>
        </Box>
    );
};
