import { ArrowRightAlt, CompareArrows } from '@mui/icons-material';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import { Avatar, Box, IconButton, Tooltip } from '@mui/material';
import { blue } from '@mui/material/colors';
import React from 'react';
import { useTranslation } from 'react-i18next';

type Props = {
    disabled?: boolean;
    distance?: string;
    in_order?: boolean;
    onClick?: (event: React.MouseEvent) => void;
    anchor?: 'left' | 'right';
};

const helpPrefix = 'common.rule_pages.rule_sets';

const RuleOrder: React.FC<Props> = (props: Props) => {
    const { disabled, distance, in_order, onClick, anchor } = props;
    const { t } = useTranslation();

    let arrows;
    if (anchor === 'left' || !anchor) {
        arrows = in_order ? <ArrowRightAlt fontSize={'inherit'} /> : <CompareArrows fontSize={'inherit'} />;
    } else {
        arrows = <SettingsOutlinedIcon fontSize={'inherit'} />;
    }

    if (onClick) {
        arrows = (
            <IconButton disabled={disabled} onClick={onClick}>
                {arrows}
            </IconButton>
        );
    }

    const order = in_order ? 'strict_order' : 'any_order';

    const word_order = t(`${helpPrefix}.tooltips.word_order`, 'word order');
    const current = t(`${helpPrefix}.tooltips.${order}`, order);

    // Fix: Wrap in a span when disabled to ensure tooltip works
    arrows = (
        <Tooltip title={`${word_order}: ${current}`}>{disabled && onClick ? <span>{arrows}</span> : arrows}</Tooltip>
    );

    return (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {arrows}
            {distance ? (
                <Avatar sx={{ bgcolor: blue[800], width: 24, height: 24, fontSize: '0.8em' }} variant='rounded'>
                    {distance}
                </Avatar>
            ) : null}
        </Box>
    );
};

export default RuleOrder;
