import { MenuBookOutlined } from '@mui/icons-material';
import { IconButton, Tooltip } from '@mui/material';
import { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { useHelp } from './HelpContext';

export const HelpButton: FC = () => {
    const { open } = useHelp();
    const { t } = useTranslation('help');
    const label = t('title', 'Help');

    return (
        <Tooltip title={label}>
            <IconButton onClick={open} aria-label={label}>
                <MenuBookOutlined />
            </IconButton>
        </Tooltip>
    );
};
