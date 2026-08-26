import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import SwapVertIcon from '@mui/icons-material/SwapVert';
import {
    Box,
    Button,
    Checkbox,
    CircularProgress,
    LinearProgress,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
    useTheme,
} from '@mui/material';
import { grey } from '@mui/material/colors';
import React, {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import { defaultFilterFor } from './common-table.utils';
import { CommonTablePaginator } from './CommonTablePaginator';
import { valueHasTime } from './filters/date-filter.utils';
import {
    ColumnFilterButton,
    FilterColumn,
    FilterPopover,
    isFilterActive,
    TableFilterPanel,
    useFilterColumnMap,
    useFilterColumns,
} from './panel';
import {
    CommonTableV2ColumnSettings,
    CommonTableV2Data,
    CommonTableV2FilterValue,
    CommonTableV2Sorting,
    CommonTableV2State,
    FilterChange,
    TableField,
} from './types';

type Props = {
    elementType: string;
    storageKey?: string;
    fields: Array<TableField>;
    idProperty?: string;
    dbState: CommonTableV2State;
    dbData: CommonTableV2Data;
    onDoubleClick?: (id: string) => void;
    pageSizes?: number[];
    /** set false to take the filter icon out of the column headers */
    showColumnFilters?: boolean;
    /** set false to drop the strip of active filters above the table; with
     *  `showColumnFilters` off too the table is bare and the filters have no
     *  UI at all */
    showFilterPanel?: boolean;
    updateDbState: (field: keyof CommonTableV2State, value: any) => void;
    getColumnSettings: (field: TableField) => CommonTableV2ColumnSettings;
};

type ColumnWidths = Record<string, number>;

const DEFAULT_COL_WIDTH = 160;
const CHECKBOX_COL_WIDTH = 48;
const MIN_COL_WIDTH = 60;
const HEADER_HEIGHT = 32;

const getStoredWidth = (
    elementType: string,
    field: string,
): number | undefined => {
    const v = localStorage.getItem(`${elementType}.${field}.column.width`);
    if (!v) return undefined;
    const n = parseInt(v, 10);
    return Number.isFinite(n) ? n : undefined;
};

const storeWidth = (elementType: string, field: string, width: number) => {
    localStorage.setItem(
        `${elementType}.${field}.column.width`,
        String(Math.round(width)),
    );
};

const withTimeKey = (storageKey: string) => `${storageKey}.filter.withTime`;

const findFilter = (
    filter: Array<CommonTableV2FilterValue> | undefined,
    name: string,
): CommonTableV2FilterValue | undefined => filter?.find((f) => f.name === name);

const replaceFilter = (
    filter: Array<CommonTableV2FilterValue> | undefined,
    next: CommonTableV2FilterValue,
): Array<CommonTableV2FilterValue> => {
    const list = filter ? [...filter] : [];
    const idx = list.findIndex((f) => f.name === next.name);
    if (idx >= 0) list[idx] = next;
    else list.push(next);
    return list;
};

export const CommonTableV2: React.FC<Props> = (props: Props) => {
    const {
        elementType,
        storageKey = elementType,
        fields,
        idProperty = '_id',
        dbData,
        dbState,
        onDoubleClick,
        pageSizes,
        showColumnFilters = true,
        showFilterPanel = true,
        updateDbState,
        getColumnSettings,
    } = props;

    const { data: rows, count } = dbData;
    const { selected, skip, loading, limit, sort, filter } = dbState;

    const { t } = useTranslation();

    const theme = useTheme();

    const visibleFields = useMemo(
        () => fields.filter((f) => !f.hidden),
        [fields],
    );

    const columnSettings = useMemo(() => {
        return visibleFields.map((f) => getColumnSettings(f));
    }, [visibleFields, getColumnSettings]);

    /* the columns a filter can be set on, shared by the header icons and the
       strip of chips above the table: both open the same editor */
    const filterColumns = useFilterColumns({
        elementType,
        fields: visibleFields,
        columnSettings,
        filter,
    });
    const filterByName = useFilterColumnMap(filterColumns);

    const [editing, setEditing] = useState<{
        name: string;
        anchor: HTMLElement;
    } | null>(null);

    const edited = editing ? filterByName.get(editing.name) : undefined;

    /* the time switch belongs to the table, not to a single bound: it decides
       the mask of every date field and outlives the page */
    const [withTime, setWithTime] = useState<boolean>(() => {
        const stored = localStorage.getItem(withTimeKey(storageKey));
        if (stored !== null) return stored === 'true';
        return visibleFields.some((f, idx) => {
            if (f.type !== 'date') return false;
            const props = columnSettings[idx]?.filterProps;
            const entry = findFilter(filter, f.field);
            return Boolean(
                props?.format &&
                    entry &&
                    valueHasTime(entry.value, props.format, props.timezone),
            );
        });
    });

    const changeWithTime = useCallback(
        (next: boolean) => {
            setWithTime(next);
            localStorage.setItem(withTimeKey(storageKey), String(next));
        },
        [storageKey],
    );

    const tableRef = useRef<HTMLTableElement>(null);

    const [widths, setWidths] = useState<ColumnWidths>(() => {
        const initial: ColumnWidths = {};
        visibleFields.forEach((f) => {
            initial[f.field] =
                getStoredWidth(storageKey, f.field) ?? DEFAULT_COL_WIDTH;
        });
        return initial;
    });

    useEffect(() => {
        setWidths((prev) => {
            const next: ColumnWidths = {};
            visibleFields.forEach((f) => {
                next[f.field] =
                    prev[f.field] ??
                    getStoredWidth(storageKey, f.field) ??
                    DEFAULT_COL_WIDTH;
            });
            return next;
        });
    }, [storageKey, visibleFields]);

    const onSortClick = (fieldName: string) => {
        if (loading) return;
        const cur = sort;
        let next: CommonTableV2Sorting | undefined;
        if (!cur || cur.name !== fieldName) {
            next = { id: fieldName, name: fieldName, dir: 1 };
        } else if (cur.dir === 1) {
            next = { id: fieldName, name: fieldName, dir: -1 };
        } else {
            next = undefined;
        }
        updateDbState('sort', next);
    };

    const onFilterChange = useCallback(
        (filterName: string, change: FilterChange) => {
            const existing = findFilter(filter, filterName);
            if (!existing) return;
            const nextEntry: CommonTableV2FilterValue = {
                ...existing,
                operator: change.operator,
                value: change.value,
            };
            updateDbState('filter', replaceFilter(filter, nextEntry));
        },
        [filter, updateDbState],
    );

    const removeFilter = useCallback(
        (column: FilterColumn) =>
            onFilterChange(column.field.field, defaultFilterFor(column.field)),
        [onFilterChange],
    );

    /* an entry is put back to its default, never dropped: the filter list is
       also the projection the backend selects the columns by */
    const resetFilters = useCallback(() => {
        if (!filter?.length) return;
        const byName = new Map(fields.map((f) => [f.field, f]));
        updateDbState(
            'filter',
            filter.map((entry) => {
                const field = byName.get(entry.name);
                return field ? { ...entry, ...defaultFilterFor(field) } : entry;
            }),
        );
    }, [fields, filter, updateDbState]);

    const anyFilterActive = useMemo(
        () => (filter ?? []).some(isFilterActive),
        [filter],
    );

    const handleRowClick = (id: string) => {
        if (loading) return;
        updateDbState('selected', selected === id ? undefined : id);
    };

    const handleRowDoubleClick = (id: string) => {
        if (loading || !onDoubleClick) return;
        onDoubleClick(id);
    };

    /* ---------- column resize ---------- */
    const resizingRef = useRef<{
        field: string;
        startX: number;
        startWidth: number;
    } | null>(null);

    useEffect(() => {
        const onMove = (e: MouseEvent) => {
            const r = resizingRef.current;
            if (!r) return;
            const delta = e.clientX - r.startX;
            const next = Math.max(MIN_COL_WIDTH, r.startWidth + delta);
            setWidths((prev) => ({ ...prev, [r.field]: next }));
        };
        const onUp = () => {
            const r = resizingRef.current;
            if (r) {
                storeWidth(
                    storageKey,
                    r.field,
                    widths[r.field] ?? r.startWidth,
                );
            }
            resizingRef.current = null;
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        };
        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
        return () => {
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('mouseup', onUp);
        };
    }, [storageKey, widths]);

    /* what the columns are on screen right now: a stretched column is wider
       than the number stored for it */
    const renderedWidths = (): ColumnWidths | undefined => {
        const cells = tableRef.current?.tHead?.rows?.[0]?.cells;
        if (!cells) return undefined;
        const next: ColumnWidths = {};
        visibleFields.forEach((f, i) => {
            /* cell 0 is the checkbox column */
            const cell = cells[i + 1];
            if (cell) next[f.field] = cell.getBoundingClientRect().width;
        });
        return next;
    };

    const startResize = (field: string, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        /* freeze the stretch before the drag: the shares below are recomputed
           from `widths`, so a drag that started from the stored number would
           snap the column to it first */
        const rendered = renderedWidths();
        if (rendered) setWidths(rendered);
        resizingRef.current = {
            field,
            startX: e.clientX,
            startWidth: (rendered ?? widths)[field] ?? DEFAULT_COL_WIDTH,
        };
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
    };

    /* ---------- render ---------- */
    const renderSortIcon = (fieldName: string) => {
        const cur = sort;
        if (!cur || cur.name !== fieldName) {
            return (
                <SwapVertIcon sx={{ fontSize: 14, color: 'grey.400' }} />
            );
        }
        return cur.dir === 1 ? (
            <ArrowUpwardIcon sx={{ fontSize: 16, color: 'primary.main' }} />
        ) : (
            <ArrowDownwardIcon sx={{ fontSize: 16, color: 'primary.main' }} />
        );
    };

    const widthSum = visibleFields.reduce(
        (s, f) => s + (widths[f.field] ?? DEFAULT_COL_WIDTH),
        0,
    );
    const totalColWidth = CHECKBOX_COL_WIDTH + widthSum;

    /* A data column is sized as its share of the columns, not as a number of
       pixels: the shares add up to 100%, and `table-layout: fixed` resolves a
       percentage against what the px-wide checkbox column leaves behind. So a
       table narrower than its container stretches its data columns
       proportionally — as it did before — while the checkbox column stays at
       CHECKBOX_COL_WIDTH whatever the window does. Written in pixels instead,
       the slack was spread over every column, the checkbox one included.
    */
    const columnShare = (field: string): string => {
        const width = widths[field] ?? DEFAULT_COL_WIDTH;
        if (widthSum <= 0) return `${width}px`;
        return `${((width / widthSum) * 100).toFixed(4)}%`;
    };

    const headerCellSx = {
        bgcolor: grey[50],
        position: 'sticky' as const,
        top: 0,
        zIndex: 2,
        padding: '8px',
        borderBottom: '2px solid',
        borderRight: 1,
        borderColor: 'divider',
        ...theme.applyStyles('dark', {
            backgroundColor: '#2c2c2c',
            '&:hover': {
                backgroundColor: '#3a3a3a',
            },
        }),
    };

    return (
        <Box
            sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                bgcolor: 'background.paper',
            }}>
            {loading && (
                <LinearProgress
                    sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        zIndex: 3,
                        height: 2,
                    }}
                />
            )}
            {showFilterPanel && (
                <TableFilterPanel
                    columns={filterColumns}
                    disabled={loading}
                    onOpen={(column, anchor) =>
                        setEditing({ name: column.field.field, anchor })
                    }
                    onRemove={removeFilter}
                    onResetAll={resetFilters}
                />
            )}
            <TableContainer
                sx={{
                    flex: 1,
                    overflow: 'auto',
                    opacity: loading ? 0.7 : 1,
                    pointerEvents: loading ? 'none' : 'auto',
                }}>
                <Table
                    ref={tableRef}
                    size='small'
                    stickyHeader
                    sx={{
                        tableLayout: 'fixed',
                        width: '100%',
                        minWidth: totalColWidth,
                        borderCollapse: 'separate',
                        borderSpacing: 0,
                    }}>
                    <colgroup>
                        <col style={{ width: CHECKBOX_COL_WIDTH }} />
                        {visibleFields.map((f) => (
                            <col
                                key={f.field}
                                style={{ width: columnShare(f.field) }}
                            />
                        ))}
                    </colgroup>
                    <TableHead>
                        {/* row 1: title + sort + filter */}
                        <TableRow>
                            <TableCell
                                rowSpan={1}
                                sx={{
                                    ...headerCellSx,
                                    height: HEADER_HEIGHT,
                                    width: CHECKBOX_COL_WIDTH,
                                    padding: 0,
                                    textAlign: 'center',
                                }}
                            />
                            {visibleFields.map((field, idx) => {
                                const setting = columnSettings[idx];
                                const tag = field.i18nTag ?? field.field;
                                const sortable = setting.sortable ?? true;
                                const filterColumn = filterByName.get(
                                    field.field,
                                );
                                return (
                                    <TableCell
                                        key={`h-${field.field}`}
                                        sx={{
                                            ...headerCellSx,
                                            position: 'sticky',
                                            top: 0,
                                            cursor: sortable
                                                ? 'pointer'
                                                : 'default',
                                            userSelect: 'none',
                                        }}
                                        onClick={
                                            sortable
                                                ? () => onSortClick(field.field)
                                                : undefined
                                        }>
                                        <Box
                                            sx={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 0.25,
                                                pr: '6px',
                                                position: 'relative',
                                            }}>
                                            <Typography
                                                variant='caption'
                                                sx={{
                                                    fontWeight: 700,
                                                    textTransform: 'uppercase',
                                                    color: 'text.primary',
                                                    flex: 1,
                                                    minWidth: 0,
                                                    whiteSpace: 'nowrap',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                }}>
                                                {t(
                                                    `details:${elementType}.fields.${tag}`,
                                                    tag,
                                                )}
                                            </Typography>
                                            {sortable && (
                                                <Box
                                                    sx={{
                                                        display: 'inline-flex',
                                                        fontSize: '14px',
                                                    }}>
                                                    {renderSortIcon(
                                                        field.field,
                                                    )}
                                                </Box>
                                            )}
                                            {showColumnFilters &&
                                                filterColumn && (
                                                    <ColumnFilterButton
                                                        column={filterColumn}
                                                        disabled={loading}
                                                        open={
                                                            editing?.name ===
                                                            field.field
                                                        }
                                                        onOpen={(anchor) =>
                                                            setEditing({
                                                                name: field.field,
                                                                anchor,
                                                            })
                                                        }
                                                    />
                                                )}
                                            <Box
                                                onMouseDown={(e) =>
                                                    startResize(field.field, e)
                                                }
                                                sx={{
                                                    position: 'absolute',
                                                    right: '-8px',
                                                    top: '-4px',
                                                    bottom: '-4px',
                                                    width: '8px',
                                                    cursor: 'col-resize',
                                                    zIndex: 3,
                                                }}
                                            />
                                        </Box>
                                    </TableCell>
                                );
                            })}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {rows.length === 0 && !loading && (
                            <TableRow>
                                <TableCell
                                    colSpan={visibleFields.length + 1}
                                    sx={{
                                        textAlign: 'center',
                                        py: 4,
                                        color: 'text.secondary',
                                    }}>
                                    <Box
                                        sx={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            gap: 1,
                                        }}>
                                        {anyFilterActive
                                            ? t(
                                                  'table:table.nothing_found',
                                                  'Nothing found',
                                              )
                                            : t(
                                                  'table:table.noRecords',
                                                  'No records',
                                              )}
                                        {anyFilterActive && (
                                            <Button
                                                size='small'
                                                onClick={resetFilters}>
                                                {t(
                                                    'table:table.reset_filters',
                                                    'Reset the filters',
                                                )}
                                            </Button>
                                        )}
                                    </Box>
                                </TableCell>
                            </TableRow>
                        )}
                        {rows.map((row, idx) => {
                            const id = row?.[idProperty];
                            const isSelected = selected === id;
                            return (
                                <TableRow
                                    key={idx}
                                    hover
                                    selected={isSelected}
                                    onClick={() => handleRowClick(id)}
                                    onDoubleClick={() =>
                                        handleRowDoubleClick(id)
                                    }
                                    sx={{ cursor: 'pointer' }}>
                                    <TableCell
                                        sx={{
                                            width: CHECKBOX_COL_WIDTH,
                                            padding: 0,
                                            textAlign: 'center',
                                        }}>
                                        <Checkbox
                                            size='small'
                                            checked={isSelected}
                                            disabled={loading}
                                            onClick={(e) => e.stopPropagation()}
                                            onChange={() => handleRowClick(id)}
                                        />
                                    </TableCell>
                                    {visibleFields.map((field, idx) => {
                                        const setting = columnSettings[idx];
                                        const raw = row?.[field.field];
                                        const node =
                                            setting.renderValue?.({
                                                key: field.field,
                                                value: raw,
                                                data: row,
                                            }) ?? raw;
                                        return (
                                            <TableCell
                                                key={`c-${field.field}-${id}`}
                                                sx={{
                                                    padding: '4px 8px',
                                                    borderRight: 1,
                                                    borderColor: 'divider',
                                                    whiteSpace: 'nowrap',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                }}>
                                                {node as React.ReactNode}
                                            </TableCell>
                                        );
                                    })}
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
                {loading && rows.length === 0 && (
                    <Box
                        sx={{
                            position: 'absolute',
                            inset: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            pointerEvents: 'none',
                        }}>
                        <CircularProgress size={32} />
                    </Box>
                )}
            </TableContainer>
            {editing && edited && (
                <FilterPopover
                    anchorEl={editing.anchor}
                    field={edited.field}
                    setting={edited.setting}
                    filter={edited.filter}
                    title={edited.title}
                    time={withTime}
                    onTimeChange={changeWithTime}
                    onApply={(change) =>
                        onFilterChange(edited.field.field, change)
                    }
                    onClose={() => setEditing(null)}
                />
            )}
            <CommonTablePaginator
                skip={skip}
                limit={limit}
                count={count}
                pageSizes={pageSizes}
                disabled={loading}
                onRefresh={() => updateDbState('limit', limit)}
                onSkipChange={(skip) => updateDbState('skip', skip)}
                onLimitChange={(limit) => updateDbState('limit', limit)}
            />
        </Box>
    );
};
