import { Box, ButtonBase, Typography } from '@mui/material';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { OperatorOption } from '../types';
import { overlineSx } from './editor.styles';

type Props = {
    operator: string;
    operators: Array<OperatorOption>;
    disabled?: boolean;
    /** the heading above the row; «Условие» unless the editor says otherwise */
    label?: string;
    onChange: (operator: string) => void;
};

/** Every condition a column can be asked, laid out in the editor itself.
 *
 *  The operator used to live behind an icon button, which made the one thing
 *  a filter has to state — the question it asks — cost a click to read and
 *  another to change. Here the choices *are* the control: the current one is
 *  lit, the rest are one click away, and none of them is behind a menu.
 */
export const OperatorSelect: React.FC<Props> = ({
    operator,
    operators,
    disabled,
    label,
    onChange,
}) => {
    const { t } = useTranslation();

    /* a column may sit on an operator its type does not list — `entity`
       starts on `eq` and a field may name its own — and the one thing this
       control exists to state is which condition is in force, so an operator
       that is not on the list joins it rather than going unmentioned */
    const shown = operators.some((o) => o.name === operator)
        ? operators
        : [...operators, { name: operator, label: operator }];

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
            <Typography sx={overlineSx}>
                {label ?? t('table:table.condition', 'Condition')}
            </Typography>
            {/* they wrap instead of scrolling: a condition the user cannot
                see is the very thing this control replaces */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {shown.map((op) => {
                    const selected = op.name === operator;
                    return (
                        <ButtonBase
                            key={op.name}
                            disabled={disabled}
                            aria-pressed={selected}
                            onClick={() => onChange(op.name)}
                            sx={{
                                px: 1,
                                py: '4px',
                                borderRadius: 1,
                                border: '1px solid',
                                borderColor: selected
                                    ? 'primary.main'
                                    : 'grey.300',
                                bgcolor: selected
                                    ? 'primary.lighter'
                                    : 'transparent',
                                color: selected
                                    ? 'primary.main'
                                    : 'text.secondary',
                                /* a <button> keeps the UA font family until
                                   it is told otherwise */
                                fontFamily: 'inherit',
                                fontSize: '0.75rem',
                                fontWeight: selected ? 500 : 400,
                                lineHeight: 1.45,
                                whiteSpace: 'nowrap',
                                '&:hover': {
                                    bgcolor: selected
                                        ? 'primary.lighter'
                                        : 'action.hover',
                                    borderColor: selected
                                        ? 'primary.main'
                                        : 'grey.400',
                                },
                                '&.Mui-focusVisible': {
                                    outline: '2px solid',
                                    outlineColor: 'primary.main',
                                    outlineOffset: '1px',
                                },
                                '&.Mui-disabled': { opacity: 0.5 },
                            }}>
                            {t(`table:table.${op.label}`, op.label)}
                        </ButtonBase>
                    );
                })}
            </Box>
        </Box>
    );
};
