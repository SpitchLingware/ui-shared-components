import FilterListIcon from '@mui/icons-material/FilterList';
import {
    IconButton,
    ListItemText,
    Menu,
    MenuItem,
    Tooltip,
} from '@mui/material';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { OperatorOption } from '../types/filter.types';

type Props = {
    operator: string;
    operators: OperatorOption[];
    disabled?: boolean;
    onChange: (operator: string) => void;
};

export const OperatorMenu: React.FC<Props> = ({
    operator,
    operators,
    disabled,
    onChange,
}) => {
    const { t } = useTranslation();
    const [anchor, setAnchor] = useState<HTMLElement | null>(null);

    const current = operators.find((o) => o.name === operator) ?? operators[0];
    const tip = t(`table:table.${current?.label ?? ''}`, current?.label ?? '');

    return (
        <>
            <Tooltip title={tip} placement='top'>
                <span>
                    <IconButton
                        size='small'
                        disabled={disabled}
                        onClick={(e) => setAnchor(e.currentTarget)}
                        sx={{ p: 0.25 }}>
                        <FilterListIcon fontSize='small' />
                    </IconButton>
                </span>
            </Tooltip>
            <Menu
                anchorEl={anchor}
                open={Boolean(anchor)}
                onClose={() => setAnchor(null)}>
                {operators.map((op) => (
                    <MenuItem
                        key={op.name}
                        selected={op.name === current?.name}
                        onClick={() => {
                            onChange(op.name);
                            setAnchor(null);
                        }}>
                        <ListItemText>
                            {t(`table:table.${op.label}`, op.label)}
                        </ListItemText>
                    </MenuItem>
                ))}
            </Menu>
        </>
    );
};
