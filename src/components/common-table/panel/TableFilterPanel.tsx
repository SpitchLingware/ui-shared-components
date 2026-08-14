import AddIcon from '@mui/icons-material/Add';
import EventIcon from '@mui/icons-material/Event';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import FilterListIcon from '@mui/icons-material/FilterList';
import ScheduleIcon from '@mui/icons-material/Schedule';
import {
    Badge,
    Box,
    Button,
    ButtonBase,
    Popover,
    Typography,
    useMediaQuery,
    useTheme,
} from '@mui/material';
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { defaultFilterFor } from '../common-table.utils';
import {
    CommonTableV2ColumnSettings,
    CommonTableV2FilterValue,
    FilterChange,
    TableField,
} from '../types';
import { AddFilterColumn, AddFilterMenu } from './AddFilterMenu';
import { FilterChipItem } from './FilterChipItem';
import { FilterPopover } from './FilterPopover';
import { isDateField, isFilterActive } from './filter-value.utils';
import { periodLabel } from './period.utils';

type Props = {
    /** i18n namespace the column labels are read from */
    elementType: string;
    fields: Array<TableField>;
    columnSettings: Array<CommonTableV2ColumnSettings>;
    filter?: Array<CommonTableV2FilterValue>;
    disabled?: boolean;
    time: boolean;
    onTimeChange: (next: boolean) => void;
    onFilterChange: (name: string, change: FilterChange) => void;
    onResetAll: () => void;
};

type Column = {
    field: TableField;
    setting: CommonTableV2ColumnSettings;
    filter: CommonTableV2FilterValue;
    title: string;
    active: boolean;
};

const CONTROL_HEIGHT = 34;

export const TableFilterPanel: React.FC<Props> = ({
    elementType,
    fields,
    columnSettings,
    filter,
    disabled,
    time,
    onTimeChange,
    onFilterChange,
    onResetAll,
}) => {
    const { t, i18n } = useTranslation();
    const theme = useTheme();
    const narrow = useMediaQuery(theme.breakpoints.down('sm'));

    const [editing, setEditing] = useState<{
        name: string;
        anchor: HTMLElement;
    } | null>(null);
    const [addAnchor, setAddAnchor] = useState<HTMLElement | null>(null);
    const [listAnchor, setListAnchor] = useState<HTMLElement | null>(null);

    const columns = useMemo((): Array<Column> => {
        return fields
            .map((field, idx) => {
                const setting = columnSettings[idx];
                const entry = filter?.find((f) => f.name === field.field);
                if (!setting?.filter || !entry) return undefined;
                const tag = field.i18nTag ?? field.field;
                return {
                    field,
                    setting,
                    filter: entry,
                    title: t(`details:${elementType}.fields.${tag}`, tag),
                    active: isFilterActive(entry),
                };
            })
            .filter(Boolean) as Array<Column>;
    }, [fields, columnSettings, filter, elementType, t]);

    const period = columns.find((c) => isDateField(c.field));
    const rest = columns.filter((c) => c !== period);
    const activeRest = rest.filter((c) => c.active);
    const anyActive = activeRest.length > 0 || Boolean(period?.active);

    const edited = editing
        ? columns.find((c) => c.field.field === editing.name)
        : undefined;

    const openEditor = (column: Column, anchor: HTMLElement) => {
        setAddAnchor(null);
        setEditing({ name: column.field.field, anchor });
    };

    const removeFilter = (column: Column) =>
        onFilterChange(column.field.field, defaultFilterFor(column.field));

    const periodText = period
        ? periodLabel(period.filter, {
              format: period.setting.filterProps?.format ?? 'YYYY-MM-DD',
              timezone: period.setting.filterProps?.timezone ?? 'UTC',
              locale: i18n.language,
              compact: narrow,
              operatorLabel: (op) => t(`table:table.${op}`, op),
              emptyLabel: period.title,
          })
        : '';

    const addColumns = useMemo(
        (): Array<AddFilterColumn> =>
            rest.map((c) => ({
                field: c.field,
                title: c.title,
                active: c.active,
            })),
        [rest],
    );

    const chips = (
        <>
            {activeRest.map((c) => (
                <FilterChipItem
                    key={c.field.field}
                    field={c.field}
                    setting={c.setting}
                    filter={c.filter}
                    title={c.title}
                    disabled={disabled}
                    onOpen={(anchor) => openEditor(c, anchor)}
                    onDelete={() => removeFilter(c)}
                />
            ))}
            {addColumns.length > 0 && (
                <ButtonBase
                    title={t('table:table.add_filter', 'Add a filter')}
                    aria-label={t('table:table.add_filter', 'Add a filter')}
                    disabled={disabled}
                    onClick={(e) =>
                        setAddAnchor(e.currentTarget as HTMLElement)
                    }
                    sx={{
                        width: 26,
                        height: 26,
                        flexShrink: 0,
                        border: '1px dashed',
                        borderColor: 'primary.main',
                        borderRadius: 1,
                        bgcolor: 'primary.lighter',
                        color: 'primary.main',
                    }}>
                    <AddIcon sx={{ fontSize: 16 }} />
                </ButtonBase>
            )}
        </>
    );

    return (
        <Box
            sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                flexWrap: 'wrap',
                px: 2,
                pb: 1.5,
                pt: 0.5,
                borderBottom: '1px solid',
                borderColor: 'divider',
                bgcolor: 'background.paper',
            }}>
            {period && (
                <Button
                    variant='outlined'
                    color='inherit'
                    disabled={disabled}
                    onClick={(e) => openEditor(period, e.currentTarget)}
                    startIcon={
                        time ? (
                            <ScheduleIcon
                                sx={{
                                    fontSize: 18,
                                    color: period.active
                                        ? 'primary.main'
                                        : 'text.secondary',
                                }}
                            />
                        ) : (
                            <EventIcon
                                sx={{
                                    fontSize: 18,
                                    color: period.active
                                        ? 'primary.main'
                                        : 'text.secondary',
                                }}
                            />
                        )
                    }
                    endIcon={
                        edited === period ? (
                            <ExpandLessIcon
                                sx={{ fontSize: 18, color: 'text.secondary' }}
                            />
                        ) : (
                            <ExpandMoreIcon
                                sx={{ fontSize: 18, color: 'text.secondary' }}
                            />
                        )
                    }
                    sx={{
                        height: CONTROL_HEIGHT,
                        px: 1.5,
                        borderColor:
                            edited === period
                                ? 'primary.main'
                                : 'grey.300',
                        color: 'text.primary',
                        fontWeight: 400,
                        textTransform: 'none',
                        whiteSpace: 'nowrap',
                        '&:hover': { borderColor: 'primary.light' },
                    }}>
                    {periodText}
                </Button>
            )}

            {period && (activeRest.length > 0 || addColumns.length > 0) && (
                <Box
                    sx={{
                        width: '1px',
                        height: 20,
                        bgcolor: 'divider',
                        display: { xs: 'none', sm: 'block' },
                    }}
                />
            )}

            {narrow ? (
                addColumns.length > 0 && (
                    <Button
                        variant='outlined'
                        color='inherit'
                        disabled={disabled}
                        aria-label={t('table:table.filters', 'Filters')}
                        onClick={(e) => setListAnchor(e.currentTarget)}
                        sx={{
                            height: CONTROL_HEIGHT,
                            minWidth: 0,
                            px: 1.5,
                            borderColor: 'grey.300',
                            color: 'text.primary',
                        }}>
                        <Badge
                            badgeContent={activeRest.length}
                            color='primary'
                            overlap='rectangular'>
                            <FilterListIcon
                                sx={{ fontSize: 18, color: 'text.secondary' }}
                            />
                        </Badge>
                    </Button>
                )
            ) : (
                chips
            )}

            {anyActive && (
                <Button
                    size='small'
                    color='inherit'
                    disabled={disabled}
                    onClick={onResetAll}
                    sx={{
                        ml: 'auto',
                        height: 26,
                        fontSize: '0.75rem',
                        color: 'text.secondary',
                        textTransform: 'none',
                    }}>
                    {t('table:table.reset_all', 'Reset all')}
                </Button>
            )}

            <Popover
                open={Boolean(listAnchor)}
                anchorEl={listAnchor}
                onClose={() => setListAnchor(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                slotProps={{ paper: { sx: { mt: 0.5, p: 1.5 } } }}>
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-start',
                        gap: 1,
                        maxWidth: 280,
                    }}>
                    <Typography
                        sx={{
                            fontSize: '0.6875rem',
                            fontWeight: 600,
                            letterSpacing: '.04em',
                            textTransform: 'uppercase',
                            color: 'text.secondary',
                        }}>
                        {t('table:table.filters', 'Filters')}
                    </Typography>
                    {chips}
                </Box>
            </Popover>

            <AddFilterMenu
                anchorEl={addAnchor}
                columns={addColumns}
                onClose={() => setAddAnchor(null)}
                onPick={(field) => {
                    const column = rest.find((c) => c.field === field);
                    const anchor = addAnchor;
                    setAddAnchor(null);
                    if (column && anchor) openEditor(column, anchor);
                }}
            />

            {editing && edited && (
                <FilterPopover
                    anchorEl={editing.anchor}
                    field={edited.field}
                    setting={edited.setting}
                    filter={edited.filter}
                    title={edited.title}
                    time={time}
                    onTimeChange={onTimeChange}
                    onApply={(change) =>
                        onFilterChange(edited.field.field, change)
                    }
                    onClose={() => setEditing(null)}
                />
            )}
        </Box>
    );
};
