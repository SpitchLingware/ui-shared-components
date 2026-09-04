import { Typography } from '@mui/material';
import React from 'react';
import { titleSx } from './editor.styles';

type Props = {
    title: string;
};

/** The head of a filter editor: which column it belongs to.
 *
 *  The two sections under it — the condition and the value — share the
 *  overline, so the name is set in a style of its own; without that the
 *  three of them read as one list.
 */
export const EditorHeader: React.FC<Props> = ({ title }) => (
    <Typography
        sx={{
            ...titleSx,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
        }}>
        {title}
    </Typography>
);
