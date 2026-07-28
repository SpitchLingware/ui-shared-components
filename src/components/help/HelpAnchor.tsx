import { HelpOutline } from '@mui/icons-material';
import { IconButton, Tooltip } from '@mui/material';
import { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { useHelp } from './HelpContext';

export const HelpAnchor: FC<{ contextKey: string; title?: string }> = ({
    contextKey,
    title,
}) => {
    const { hasContext, canEdit, openByContextKey, createForContext } =
        useHelp();
    const { t } = useTranslation('help');

    if (hasContext(contextKey)) {
        const label = t('anchor', 'Help for this section');

        return (
            <Tooltip title={label}>
                <IconButton
                    size='small'
                    aria-label={label}
                    onClick={() => openByContextKey(contextKey)}>
                    <HelpOutline fontSize='small' color='primary' />
                </IconButton>
            </Tooltip>
        );
    }

    if (canEdit) {
        const label = t('anchorCreate', 'Create help for this section');

        return (
            <Tooltip title={label}>
                <IconButton
                    size='small'
                    aria-label={label}
                    sx={{ opacity: 0.4 }}
                    onClick={() => createForContext(contextKey, title)}>
                    <HelpOutline fontSize='small' />
                </IconButton>
            </Tooltip>
        );
    }

    return null;
};
