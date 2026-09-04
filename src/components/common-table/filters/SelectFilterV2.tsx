import {
    Box,
    Button,
    Checkbox,
    ListItemText,
    MenuItem,
    TextField,
} from '@mui/material';
import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FilterEditorProps, SELECT_OPERATORS } from '../types/filter.types';
import { OperatorMenu } from './OperatorMenu';

type Option = { id: string; label: string };

const normalizeValue = (raw: any): string[] => {
    if (Array.isArray(raw)) return raw.map(String);
    if (raw === undefined || raw === null || raw === '') return [];
    return [String(raw)];
};

const arraysEqual = (a: string[], b: string[]) => {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
    return true;
};

type Props = FilterEditorProps & {
    filterProps?: {
        dataSource?: Option[] | (() => Promise<Option[]>);
        placeholder?: string;
        multiple?: boolean;
    };
};

const LIST_MAX_HEIGHT = 500;

export const SelectFilterV2: React.FC<Props> = ({
    filter,
    disabled,
    hideOperator,
    onChange,
    filterProps,
}) => {
    const { t } = useTranslation();
    const multiple = filterProps?.multiple !== false;
    const [options, setOptions] = useState<Option[]>([]);
    const selected = normalizeValue(filter.value);

    const [open, setOpen] = useState(false);
    const [draft, setDraft] = useState<string[]>(selected);
    const appliedRef = useRef(false);

    useEffect(() => {
        const ds = filterProps?.dataSource;
        if (!ds) {
            setOptions([]);
            return;
        }
        if (Array.isArray(ds)) {
            setOptions(ds);
            return;
        }
        let cancelled = false;
        Promise.resolve(ds())
            .then((res) => {
                if (!cancelled) setOptions(res || []);
            })
            .catch(() => {
                if (!cancelled) setOptions([]);
            });
        return () => {
            cancelled = true;
        };
    }, [filterProps?.dataSource]);

    useEffect(() => {
        if (!open) setDraft(selected);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filter.value]);

    const renderLabel = (ids: string[]) => {
        if (ids.length === 0) {
            return (
                <em style={{ color: '#999' }}>
                    {filterProps?.placeholder ?? ''}
                </em>
            );
        }
        return ids
            .map((id) => options.find((o) => o.id === id)?.label ?? id)
            .join(', ');
    };

    const sx = {
        flex: 1,
        bgcolor: 'background.paper',
        '& .MuiInputBase-root': { fontSize: '0.8rem' },
    } as const;

    if (!multiple) {
        return (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <TextField
                    size='small'
                    select
                    value={selected[0] ?? ''}
                    disabled={disabled}
                    slotProps={{
                        select: {
                            displayEmpty: true,
                            renderValue: (val) =>
                                renderLabel(val ? [String(val)] : []),
                        },
                    }}
                    onChange={(e) => {
                        const raw = e.target.value;
                        onChange({
                            value: raw === '' ? '' : raw,
                            operator: filter.operator,
                        });
                    }}
                    sx={sx}>
                    <MenuItem value=''>—</MenuItem>
                    {options.map((o) => (
                        <MenuItem key={o.id} value={o.id}>
                            <ListItemText primary={o.label} />
                        </MenuItem>
                    ))}
                </TextField>
                {!hideOperator && (
                    <OperatorMenu
                        operator={filter.operator}
                        operators={SELECT_OPERATORS}
                        disabled={disabled}
                        onChange={(operator) =>
                            onChange({ value: filter.value, operator })
                        }
                    />
                )}
            </Box>
        );
    }

    const handleOpen = () => {
        appliedRef.current = false;
        setDraft(selected);
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
        if (!appliedRef.current) setDraft(selected);
    };

    const handleApply = () => {
        appliedRef.current = true;
        if (!arraysEqual(draft, selected)) {
            onChange({ value: draft, operator: filter.operator });
        }
        setOpen(false);
    };

    const handleClear = () => {
        setDraft([]);
    };

    return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <TextField
                size='small'
                select
                value={draft}
                disabled={disabled}
                slotProps={{
                    select: {
                        multiple: true,
                        open,
                        onOpen: handleOpen,
                        onClose: handleClose,
                        displayEmpty: true,
                        renderValue: (val) =>
                            renderLabel(
                                Array.isArray(val) ? (val as string[]) : [],
                            ),
                        MenuProps: {
                            slotProps: {
                                paper: {
                                    sx: {
                                        display: 'flex',
                                        flexDirection: 'column',
                                        maxHeight: LIST_MAX_HEIGHT,
                                        overflow: 'hidden',
                                    },
                                },
                            },
                            MenuListProps: {
                                sx: {
                                    p: 0,
                                    overflowY: 'auto',
                                    flex: 1,
                                    minHeight: 0,
                                },
                            },
                        },
                    },
                }}
                onChange={(e) => {
                    const raw = e.target.value;
                    const next = Array.isArray(raw)
                        ? (raw as string[])
                        : [String(raw)];
                    setDraft(next);
                }}
                sx={sx}>
                <Box
                    onKeyDown={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                    sx={{
                        position: 'sticky',
                        top: 0,
                        zIndex: 1,
                        display: 'flex',
                        gap: 1,
                        p: 1,
                        bgcolor: 'background.paper',
                        borderBottom: '1px solid',
                        borderColor: 'divider',
                    }}>
                    <Button
                        size='small'
                        variant='contained'
                        color={'secondary'}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={handleApply}>
                        {t('table:table.apply', 'Apply')}
                    </Button>
                    <Button
                        size='small'
                        variant='outlined'
                        color={'secondary'}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={handleClear}>
                        {t('table:table.clear', 'Clear')}
                    </Button>
                </Box>
                {options.map((o) => (
                    <MenuItem key={o.id} value={o.id}>
                        <Checkbox
                            size='small'
                            checked={draft.indexOf(o.id) > -1}
                        />
                        <ListItemText primary={o.label} />
                    </MenuItem>
                ))}
            </TextField>
            {!hideOperator && (
                <OperatorMenu
                    operator={filter.operator}
                    operators={SELECT_OPERATORS}
                    disabled={disabled}
                    onChange={(operator) =>
                        onChange({ value: filter.value, operator })
                    }
                />
            )}
        </Box>
    );
};
