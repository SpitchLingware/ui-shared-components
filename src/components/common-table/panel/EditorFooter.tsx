import { Box, Button } from '@mui/material';
import React from 'react';
import { useTranslation } from 'react-i18next';

type Props = {
    onSecondary: () => void;
    onApply: () => void;
    secondaryLabel: string;
    applyDisabled?: boolean;
};

export const EditorFooter: React.FC<Props> = ({
    onSecondary,
    onApply,
    secondaryLabel,
    applyDisabled,
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
