import { ListSubheader, TextField } from '@mui/material';
import React from 'react';

type Props = {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
};

/**
 * The type-ahead box a long option list needs, made to survive inside a MUI `Select` menu.
 *
 * The three stopped events are the whole point: without them the menu's own type-ahead eats
 * every keystroke and jumps the highlight, and a click in the box closes the menu before the
 * first letter arrives.
 */
export const FilterOptionSearch: React.FC<Props> = ({
    value,
    onChange,
    placeholder = 'Search...',
}) => (
    <ListSubheader
        disableSticky
        sx={{ py: 1, px: 1, bgcolor: 'background.paper' }}
        onMouseDown={(event) => event.stopPropagation()}
        onClick={(event) => event.stopPropagation()}>
        <TextField
            size='small'
            fullWidth
            value={value}
            placeholder={placeholder}
            onChange={(event) => onChange(event.target.value)}
            onKeyDown={(event) => event.stopPropagation()}
        />
    </ListSubheader>
);
