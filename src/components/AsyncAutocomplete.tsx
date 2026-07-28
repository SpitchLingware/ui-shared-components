import { Autocomplete, CircularProgress, TextField } from '@mui/material';
import React from 'react';

export type AsyncItem<T = string> = {
    label: string;
    value: T;
};

type Props<T extends AsyncItem> = {
    label: string;
    getOptions: () => Promise<Array<T>>;
    value: T | null;
    onSelect: (value: T | null) => void;
    disabled?: boolean;
};

export function AsyncAutocomplete<T extends AsyncItem = AsyncItem>(
    props: Props<T>,
) {
    const { getOptions, label, value, onSelect, disabled } = props;

    const [open, setOpen] = React.useState(false);
    const isOpen = !disabled && open;
    const requestIdRef = React.useRef(0);
    const openRef = React.useRef(isOpen);

    React.useEffect(() => {
        openRef.current = isOpen;
    }, [isOpen]);

    const [options, loadOptions, isPending] = React.useActionState(
        async (
            _prevOptions: Array<T>,
            payload: { open: boolean; requestId: number },
        ) => {
            if (!payload.open) {
                return [];
            }

            const nextOptions = await getOptions();

            if (
                !openRef.current ||
                requestIdRef.current !== payload.requestId
            ) {
                return [];
            }

            return nextOptions;
        },
        [],
    );

    React.useEffect(() => {
        requestIdRef.current += 1;
        void loadOptions({
            open: isOpen,
            requestId: requestIdRef.current,
        });
    }, [isOpen, getOptions, loadOptions]);

    return (
        <Autocomplete
            size={'small'}
            fullWidth
            disabled={disabled}
            open={isOpen}
            onOpen={() => {
                setOpen(true);
            }}
            onClose={() => {
                setOpen(false);
            }}
            isOptionEqualToValue={(option, value) =>
                option.value === value.value
            }
            value={value}
            onChange={(event, value) => {
                onSelect(value);
            }}
            getOptionLabel={(option) => option.label}
            options={options}
            loading={isPending}
            renderInput={(params) => (
                <TextField
                    {...params}
                    label={label}
                    margin={'dense'}
                    disabled={disabled}
                    slotProps={{
                        input: {
                            ...params.InputProps,
                            style: {
                                backgroundColor: 'white',
                            },
                            startAdornment: (
                                <React.Fragment>
                                    {isPending ? (
                                        <CircularProgress
                                            color='inherit'
                                            size={20}
                                            sx={{ mr: 1 }}
                                        />
                                    ) : null}
                                    {params.InputProps.startAdornment}
                                </React.Fragment>
                            ),
                            endAdornment: params.InputProps.endAdornment,
                        },
                        inputLabel: {
                            ...params.InputLabelProps,
                            shrink: true,
                        },
                    }}
                />
            )}
        />
    );
}
