import FirstPageIcon from '@mui/icons-material/FirstPage';
import LastPageIcon from '@mui/icons-material/LastPage';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import RefreshIcon from '@mui/icons-material/Refresh';
import {
    Box,
    IconButton,
    MenuItem,
    Stack,
    TextField,
    Typography,
    useTheme,
} from '@mui/material';
import { grey } from '@mui/material/colors';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

type Props = {
    skip: number;
    limit: number;
    count: number;
    pageSizes?: number[];
    disabled?: boolean;
    onSkipChange: (skip: number) => void;
    onLimitChange: (limit: number) => void;
    onRefresh: () => void;
};

const DEFAULT_PAGE_SIZES = [10, 20, 50, 100];

export const CommonTablePaginator: React.FC<Props> = ({
    skip,
    limit,
    count,
    pageSizes = DEFAULT_PAGE_SIZES,
    disabled,
    onSkipChange,
    onLimitChange,
    onRefresh,
}) => {
    const { t } = useTranslation();
    const theme = useTheme();

    const totalPages = Math.max(1, Math.ceil(count / Math.max(1, limit)));
    const currentPage = Math.min(
        totalPages,
        Math.floor(skip / Math.max(1, limit)) + 1,
    );

    const [pageInput, setPageInput] = useState<string>(String(currentPage));

    useEffect(() => {
        setPageInput(String(currentPage));
    }, [currentPage]);

    const goToPage = (page: number) => {
        const clamped = Math.max(1, Math.min(totalPages, page));
        onSkipChange((clamped - 1) * limit);
    };

    const from = count === 0 ? 0 : skip + 1;
    const to = Math.min(count, skip + limit);

    const isFirst = currentPage <= 1;
    const isLast = currentPage >= totalPages;

    return (
        <Stack
            direction='row'
            alignItems='center'
            spacing={1}
            sx={{
                px: 1,
                py: 0.5,
                borderTop: 1,
                borderColor: 'divider',
                bgcolor: grey[100],
                fontSize: '0.8rem',
                ...theme.applyStyles('dark', {
                    backgroundColor: '#2c2c2c',
                    '&:hover': {
                        backgroundColor: '#3a3a3a',
                    },
                }),
            }}>
            <IconButton
                size='small'
                onClick={onRefresh}
                disabled={disabled}
                title={t('table:table.refresh', 'refresh')}>
                <RefreshIcon fontSize='small' />
            </IconButton>

            <IconButton
                size='small'
                onClick={() => goToPage(1)}
                disabled={disabled || isFirst}>
                <FirstPageIcon fontSize='small' />
            </IconButton>
            <IconButton
                size='small'
                onClick={() => goToPage(currentPage - 1)}
                disabled={disabled || isFirst}>
                <NavigateBeforeIcon fontSize='small' />
            </IconButton>

            <Typography variant='caption'>
                {t('table:table.pageText', 'Page')}
            </Typography>
            <TextField
                size='small'
                value={pageInput}
                disabled={disabled}
                onChange={(e) =>
                    setPageInput(e.target.value.replace(/[^0-9]/g, ''))
                }
                onBlur={() => {
                    const n = parseInt(pageInput, 10);
                    if (Number.isFinite(n)) goToPage(n);
                    else setPageInput(String(currentPage));
                }}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                        const n = parseInt(pageInput, 10);
                        if (Number.isFinite(n)) goToPage(n);
                        (e.target as HTMLInputElement).blur();
                    }
                }}
                sx={{
                    width: 56,
                    bgcolor: 'background.paper',
                    '& .MuiInputBase-input': {
                        textAlign: 'center',
                        fontSize: '0.8rem',
                        py: 0.5,
                    },
                }}
            />
            <Typography variant='caption'>
                {t('table:table.ofText', 'of')} {totalPages}
            </Typography>

            <IconButton
                size='small'
                onClick={() => goToPage(currentPage + 1)}
                disabled={disabled || isLast}>
                <NavigateNextIcon fontSize='small' />
            </IconButton>
            <IconButton
                size='small'
                onClick={() => goToPage(totalPages)}
                disabled={disabled || isLast}>
                <LastPageIcon fontSize='small' />
            </IconButton>

            <Box sx={{ flex: 1 }} />

            <Typography variant='caption'>
                {from} - {to} {t('table:table.ofText', 'of')} {count}
            </Typography>

            <TextField
                size='small'
                select
                value={limit}
                disabled={disabled}
                onChange={(e) => onLimitChange(Number(e.target.value))}
                sx={{
                    width: 80,
                    bgcolor: 'background.paper',
                    '& .MuiInputBase-input': {
                        fontSize: '0.8rem',
                        py: 0.5,
                    },
                }}>
                {pageSizes.map((sz) => (
                    <MenuItem key={sz} value={sz}>
                        {sz}
                    </MenuItem>
                ))}
            </TextField>
            <Typography variant='caption'>
                {t('table:table.perPageText', 'per page')}
            </Typography>
        </Stack>
    );
};
