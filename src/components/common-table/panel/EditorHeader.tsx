import CloseIcon from '@mui/icons-material/Close';
import { Box, IconButton, Tooltip, Typography } from '@mui/material';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { titleSx } from './editor.styles';

type Props = {
    title: string;
    /** the column is already untouched — there is nothing to throw away */
    resetDisabled?: boolean;
    onReset: () => void;
};

/** The head of a filter editor: the column it belongs to on the left, and on
 *  the right the one gesture that puts that column back to unfiltered.
 *
 *  «Сбросить» only rewrites what the popover holds — «Применить» is still
 *  what commits it, and «Отмена» is still the way back — so the cross costs
 *  nothing to press by mistake.
 */
export const EditorHeader: React.FC<Props> = ({
    title,
    resetDisabled,
    onReset,
}) => {
    const { t } = useTranslation();
    const tip = t('table:table.reset', 'Reset');

    return (
        <Box
            sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 1,
            }}>
            <Typography
                sx={{
                    ...titleSx,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                }}>
                {title}
            </Typography>
            {/* a disabled button fires no events of its own, and a tooltip
                listens on the child it wraps — hence the span */}
            <Tooltip title={tip} placement='top'>
                <span style={{ display: 'inline-flex' }}>
                    <IconButton
                        size='small'
                        aria-label={tip}
                        disabled={resetDisabled}
                        onClick={onReset}
                        sx={{
                            p: '2px',
                            flexShrink: 0,
                            color: 'text.disabled',
                            /* it throws work away, so it reads as destructive
                               the moment the pointer is on it */
                            '&:hover': {
                                color: 'error.main',
                                bgcolor: 'error.lighter',
                            },
                        }}>
                        <CloseIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                </span>
            </Tooltip>
        </Box>
    );
};
