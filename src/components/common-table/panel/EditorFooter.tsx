import { Box, Button } from '@mui/material';
import React from 'react';
import { useTranslation } from 'react-i18next';

type Props = {
    onSecondary: () => void;
    onApply: () => void;
    secondaryLabel: string;
    applyDisabled?: boolean;
    /** «Очистить» — takes the column back to unfiltered and commits it there
     *  and then, so it is left out of editors that have nothing to clear */
    onClear?: () => void;
    clearDisabled?: boolean;
};

export const EditorFooter: React.FC<Props> = ({
    onSecondary,
    onApply,
    secondaryLabel,
    applyDisabled,
    onClear,
    clearDisabled,
}) => {
    const { t } = useTranslation();
    return (
        <Box
            sx={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: 1,
                borderTop: '1px solid',
                borderColor: 'divider',
                pt: 1.5,
            }}>
            {onClear && (
                /* apart from the pair on the right: it is the one button here
                   that throws work away, and it does it without waiting for
                   «Применить» */
                <Button
                    size='small'
                    color='inherit'
                    disabled={clearDisabled}
                    onClick={onClear}
                    sx={{
                        mr: 'auto',
                        color: 'text.secondary',
                        '&:hover': {
                            color: 'error.main',
                            bgcolor: 'error.lighter',
                        },
                    }}>
                    {t('table:table.clear', 'Clear')}
                </Button>
            )}
            <Button size='small' color='inherit' onClick={onSecondary}>
                {secondaryLabel}
            </Button>
            <Button
                size='small'
                variant='contained'
                disabled={applyDisabled}
                onClick={onApply}>
                {t('table:table.apply', 'Apply')}
            </Button>
        </Box>
    );
};
