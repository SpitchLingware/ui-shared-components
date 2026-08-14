import { Popover } from '@mui/material';
import React from 'react';
import {
    CommonTableV2ColumnSettings,
    CommonTableV2FilterValue,
    FilterChange,
    TableField,
} from '../types';
import { isDateField } from './filter-value.utils';
import { PeriodEditor } from './PeriodEditor';
import { ValueEditor } from './ValueEditor';

type Props = {
    anchorEl: HTMLElement | null;
    field: TableField;
    setting: CommonTableV2ColumnSettings;
    filter: CommonTableV2FilterValue;
    title: string;
    time: boolean;
    onTimeChange: (next: boolean) => void;
    onApply: (change: FilterChange) => void;
    onClose: () => void;
};

export const FilterPopover: React.FC<Props> = ({
    anchorEl,
    field,
    setting,
    filter,
    title,
    time,
    onTimeChange,
    onApply,
    onClose,
}) => (
    <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={onClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        slotProps={{ paper: { sx: { mt: 0.5, maxWidth: '100vw' } } }}>
        {isDateField(field) ? (
            <PeriodEditor
                filter={filter}
                format={setting.filterProps?.format ?? 'YYYY-MM-DD'}
                timezone={setting.filterProps?.timezone ?? 'UTC'}
                timeAvailable={Boolean(setting.filterProps?.withTime)}
                time={time}
                onTimeChange={onTimeChange}
                onApply={onApply}
                onClose={onClose}
            />
        ) : (
            <ValueEditor
                field={field}
                setting={setting}
                filter={filter}
                title={title}
                onApply={onApply}
                onClose={onClose}
            />
        )}
    </Popover>
);
