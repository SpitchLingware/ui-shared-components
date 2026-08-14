import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SwapVertIcon from '@mui/icons-material/SwapVert';
import {
    Box,
    Checkbox,
    CircularProgress,
    IconButton,
    LinearProgress,
    SxProps,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Theme,
    Typography,
} from '@mui/material';
import React, {
    ReactNode,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import { CommonTablePaginator } from './CommonTablePaginator';
import {
    CommonTableV2ColumnSettings,
    CommonTableV2Data,
    CommonTableV2FilterValue,
    CommonTableV2RowDrag,
    CommonTableV2RowSx,
    CommonTableV2Sorting,
    CommonTableV2State,
    FilterChange,
    TableField,
} from './types';

type Props = {
    elementType: string;
    fields: Array<TableField>;
    idProperty?: string;
    /**
     * Identity of a row for selection, keys, `data-id` and double click. Defaults to the
     * `idProperty` value falling back to `id`, `name` and finally the index — rows of the
     * report-template models carry `id` but no `_id`, and a table that cannot tell them
     * apart renders every row selected.
     */
    getRowId?: (row: any, index: number) => string;
    dbState: CommonTableV2State;
    dbData: CommonTableV2Data;
    onDoubleClick?: (id: string, row: any) => void;
    pageSizes?: number[];
    updateDbState: (field: keyof CommonTableV2State, value: any) => void;
    getColumnSettings: (field: TableField) => CommonTableV2ColumnSettings;

    /** drop the selection column altogether (e.g. a read-only audit log) */
    selectable?: boolean;
    /** selection is a list of ids plus a "select all on this page" header checkbox */
    multiSelect?: boolean;
    /**
     * A click anywhere in a row toggles its selection. Turn it off where the checkbox is the
     * only way to select - a table whose rows open an editor on double click would otherwise
     * select and deselect on the way there.
     */
    selectOnRowClick?: boolean;
    /** the caller renders its own footer instead of the built-in paginator */
    hidePaginator?: boolean;
    /** drop the filter row even when columns declare filters */
    hideFilterRow?: boolean;
    /** slice `dbData.data` locally and count from it, instead of trusting `dbData.count` */
    internalPaging?: boolean;
    /** per-row style, e.g. to mark a row whose dependencies cannot be read */
    getRowSx?: CommonTableV2RowSx;
    /** rendered in a full-width row underneath its row; a nullish result renders nothing */
    renderDetail?: (row: any) => ReactNode;
    /** adds the chevron column that toggles a row's detail panel */
    expandable?: boolean;
    isRowExpanded?: (row: any, id: string) => boolean;
    onToggleExpand?: (row: any, id: string) => void;
    drag?: CommonTableV2RowDrag;
    /** rendered above the table, inside the same surface */
    toolbarSlot?: ReactNode;
    /**
     * Namespace of the persisted column widths. Defaults to `elementType`, which two lists of
     * the same collection on different screens would share and overwrite for each other.
     */
    storageKeyPrefix?: string;
};

type ColumnWidths = Record<string, number>;

const DEFAULT_COL_WIDTH = 160;
const CONTROL_COL_WIDTH = 44;
const MIN_COL_WIDTH = 60;
const HEADER_ROW_HEIGHT = 32;

const getStoredWidth = (prefix: string, field: string): number | undefined => {
    const v = localStorage.getItem(`${prefix}.${field}.column.width`);
    if (!v) return undefined;
    const n = parseInt(v, 10);
    return Number.isFinite(n) ? n : undefined;
};

const storeWidth = (prefix: string, field: string, width: number) => {
    localStorage.setItem(
        `${prefix}.${field}.column.width`,
        String(Math.round(width)),
    );
};

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

const toIdList = (selected: CommonTableV2State['selected']): Array<string> => {
    if (Array.isArray(selected)) return selected;
    return selected === undefined || selected === '' ? [] : [selected];
};

export const CommonTableV2: React.FC<Props> = (props: Props) => {
    const {
        elementType,
        fields,
        idProperty = '_id',
        getRowId,
        dbData,
        dbState,
        onDoubleClick,
        pageSizes,
        updateDbState,
        getColumnSettings,
        selectable = true,
        multiSelect = false,
        selectOnRowClick = true,
        hidePaginator = false,
        hideFilterRow = false,
        internalPaging = false,
        getRowSx,
        renderDetail,
        expandable = false,
        isRowExpanded,
        onToggleExpand,
        drag,
        toolbarSlot,
        storageKeyPrefix,
    } = props;

    const { selected, skip, loading, limit, sort, filter } = dbState;

    const { t } = useTranslation();

    const widthPrefix = storageKeyPrefix || elementType;

    const resolveRowId = useCallback(
        (row: any, index: number): string =>
            String(
                getRowId
                    ? getRowId(row, index)
                    : (row?.[idProperty] ?? row?.id ?? row?.name ?? index),
            ),
        [getRowId, idProperty],
    );

    const visibleFields = useMemo(
        () => fields.filter((f) => !f.hidden),
        [fields],
    );

    const columnSettings = useMemo(() => {
        return visibleFields.map((f) => getColumnSettings(f));
    }, [visibleFields, getColumnSettings]);

    const [widths, setWidths] = useState<ColumnWidths>(() => {
        const initial: ColumnWidths = {};
        visibleFields.forEach((f) => {
            initial[f.field] =
                getStoredWidth(widthPrefix, f.field) ??
                f.width ??
                DEFAULT_COL_WIDTH;
        });
        return initial;
    });

    useEffect(() => {
        setWidths((prev) => {
            const next: ColumnWidths = {};
            let changed = Object.keys(prev).length !== visibleFields.length;
            visibleFields.forEach((f) => {
                next[f.field] =
                    prev[f.field] ??
                    getStoredWidth(widthPrefix, f.field) ??
                    f.width ??
                    DEFAULT_COL_WIDTH;
                if (next[f.field] !== prev[f.field]) changed = true;
            });
            /* a fresh object on every run would re-enter this effect through `widths` below */
            return changed ? next : prev;
        });
    }, [widthPrefix, visibleFields]);

    /* ---------- rows on screen ---------- */
    const { data, count: reportedCount } = dbData;

    const rows = useMemo(() => {
        if (!internalPaging) return data;
        return data.slice(skip, skip + limit);
    }, [internalPaging, data, skip, limit]);

    const count = internalPaging ? data.length : reportedCount;
    const rowOffset = internalPaging ? skip : 0;

    const rowIds = useMemo(
        () => rows.map((row, idx) => resolveRowId(row, rowOffset + idx)),
        [rows, rowOffset, resolveRowId],
    );

    const selectedIds = useMemo(() => new Set(toIdList(selected)), [selected]);

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
        (field: TableField, change: FilterChange) => {
            const existing = findFilter(filter, field.field);
            /* seeding is the caller's job, but a missing entry must not swallow the change */
            const nextEntry: CommonTableV2FilterValue = {
                name: field.field,
                type: existing?.type ?? field.type,
                ...existing,
                operator: change.operator,
                value: change.value,
            };
            updateDbState('filter', replaceFilter(filter, nextEntry));
        },
        [filter, updateDbState],
    );

    const emitSelection = useCallback(
        (ids: Array<string>) => {
            updateDbState(
                'selected',
                multiSelect ? ids : (ids[0] ?? undefined),
            );
        },
        [multiSelect, updateDbState],
    );

    const toggleSelection = (id: string) => {
        if (loading || !selectable) return;
        if (selectedIds.has(id)) {
            emitSelection(toIdList(selected).filter((item) => item !== id));
            return;
        }
        emitSelection(multiSelect ? [...toIdList(selected), id] : [id]);
    };

    const handleRowDoubleClick = (id: string, row: any) => {
        if (loading || !onDoubleClick) return;
        onDoubleClick(id, row);
    };

    const isAllSelected =
        rowIds.length > 0 && rowIds.every((id) => selectedIds.has(id));
    const isPartiallySelected =
        !isAllSelected && rowIds.some((id) => selectedIds.has(id));

    const handleSelectAll = () => {
        if (loading) return;
        const onPage = new Set(rowIds);
        const offPage = toIdList(selected).filter((id) => !onPage.has(id));
        /* the selection survives paging, so only this page's ids are added or dropped */
        emitSelection(isAllSelected ? offPage : [...offPage, ...rowIds]);
    };

    /* ---------- column resize ---------- */
    const resizingRef = useRef<{
        field: string;
        startX: number;
        startWidth: number;
        minWidth: number;
    } | null>(null);

    useEffect(() => {
        const onMove = (e: MouseEvent) => {
            const r = resizingRef.current;
            if (!r) return;
            const delta = e.clientX - r.startX;
            const next = Math.max(r.minWidth, r.startWidth + delta);
            setWidths((prev) => ({ ...prev, [r.field]: next }));
        };
        const onUp = () => {
            const r = resizingRef.current;
            if (r) {
                storeWidth(
                    widthPrefix,
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
    }, [widthPrefix, widths]);

    const startResize = (field: TableField, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        resizingRef.current = {
            field: field.field,
            startX: e.clientX,
            startWidth: widths[field.field] ?? DEFAULT_COL_WIDTH,
            minWidth: field.minWidth ?? MIN_COL_WIDTH,
        };
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
    };

    /* ---------- row reorder ---------- */
    const [dragIndex, setDragIndex] = useState<number | null>(null);

    const onRowDrop = (targetIndex: number, targetRow: any) => {
        const from = dragIndex;
        setDragIndex(null);
        if (from === null || from === targetIndex) return;
        if (drag?.isDragDisabled?.(targetRow)) return;
        drag?.onRowOrderChange(from, targetIndex);
    };

    /* ---------- render ---------- */
    const renderSortIcon = (fieldName: string) => {
        const cur = sort;
        if (!cur || cur.name !== fieldName) {
            return <SwapVertIcon fontSize='inherit' sx={{ opacity: 0.35 }} />;
        }
        return cur.dir === 1 ? (
            <ArrowUpwardIcon fontSize='inherit' />
        ) : (
            <ArrowDownwardIcon fontSize='inherit' />
        );
    };

    /* leading columns, in render order; every one of them owns a <col> and a header cell */
    const leadingColumns: Array<'drag' | 'expand' | 'select'> = [];
    if (drag) leadingColumns.push('drag');
    if (expandable) leadingColumns.push('expand');
    if (selectable) leadingColumns.push('select');

    const columnCount = leadingColumns.length + visibleFields.length;

    const hasFilterRow =
        !hideFilterRow && columnSettings.some((setting) => setting.filter);

    const totalColWidth =
        leadingColumns.length * CONTROL_COL_WIDTH +
        visibleFields.reduce(
            (s, f) => s + (widths[f.field] ?? DEFAULT_COL_WIDTH),
            0,
        );

    const headerCellSx: SxProps<Theme> = {
        bgcolor: 'background.default',
        position: 'sticky',
        top: 0,
        zIndex: 2,
        padding: '4px 8px',
        borderRight: 1,
        borderColor: 'divider',
    };

    const filterCellSx: SxProps<Theme> = {
        ...(headerCellSx as object),
        top: HEADER_ROW_HEIGHT,
        padding: '2px 4px',
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
            {toolbarSlot}
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
            <TableContainer
                sx={{
                    flex: 1,
                    overflow: 'auto',
                    opacity: loading ? 0.7 : 1,
                    pointerEvents: loading ? 'none' : 'auto',
                }}>
                <Table
                    role='grid'
                    size='small'
                    stickyHeader
                    sx={{
                        tableLayout: 'fixed',
                        width: totalColWidth,
                        minWidth: '100%',
                        borderCollapse: 'separate',
                        borderSpacing: 0,
                    }}>
                    <colgroup>
                        {leadingColumns.map((kind) => (
                            <col
                                key={`lead-${kind}`}
                                style={{ width: CONTROL_COL_WIDTH }}
                            />
                        ))}
                        {visibleFields.map((f) => (
                            <col
                                key={f.field}
                                style={{
                                    width: widths[f.field] ?? DEFAULT_COL_WIDTH,
                                }}
                            />
                        ))}
                    </colgroup>
                    <TableHead>
                        {/* row 1: title + sort */}
                        <TableRow role='row'>
                            {leadingColumns.map((kind) => (
                                <TableCell
                                    key={`lead-h-${kind}`}
                                    role='columnheader'
                                    data-field={`__${kind}__`}
                                    sx={{
                                        ...(headerCellSx as object),
                                        height: HEADER_ROW_HEIGHT,
                                        textAlign: 'center',
                                        padding: 0,
                                    }}>
                                    {kind === 'select' && multiSelect ? (
                                        <Checkbox
                                            size='small'
                                            color='secondary'
                                            checked={isAllSelected}
                                            indeterminate={isPartiallySelected}
                                            disabled={loading}
                                            onChange={handleSelectAll}
                                            slotProps={{
                                                input: {
                                                    'aria-label':
                                                        'select all items',
                                                },
                                            }}
                                        />
                                    ) : null}
                                </TableCell>
                            ))}
                            {visibleFields.map((field, idx) => {
                                const setting = columnSettings[idx];
                                const tag = field.i18nTag ?? field.field;
                                const sortable = setting.sortable ?? true;
                                return (
                                    <TableCell
                                        key={`h-${field.field}`}
                                        role='columnheader'
                                        data-field={field.field}
                                        sx={{
                                            ...(headerCellSx as object),
                                            cursor: sortable
                                                ? 'pointer'
                                                : 'default',
                                            userSelect: 'none',
                                            textAlign: field.align ?? 'left',
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
                                                gap: 0.5,
                                                pr: '6px',
                                                position: 'relative',
                                            }}>
                                            <Typography
                                                variant='caption'
                                                sx={{
                                                    fontWeight: 600,
                                                    flex: 1,
                                                    whiteSpace: 'nowrap',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                }}>
                                                {field.label ??
                                                    t(
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
                                            <Box
                                                onMouseDown={(e) =>
                                                    startResize(field, e)
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
                        {/* row 2: filters */}
                        {hasFilterRow && (
                            <TableRow role='row'>
                                {leadingColumns.map((kind) => (
                                    <TableCell
                                        key={`lead-f-${kind}`}
                                        sx={filterCellSx}
                                    />
                                ))}
                                {visibleFields.map((field, idx) => {
                                    const setting = columnSettings[idx];
                                    const FilterComp = setting.filter as
                                        React.FC<any> | undefined;
                                    const fv = findFilter(filter, field.field);
                                    return (
                                        <TableCell
                                            key={`f-${field.field}`}
                                            data-field={field.field}
                                            sx={filterCellSx}>
                                            {FilterComp && fv && (
                                                <FilterComp
                                                    filter={fv}
                                                    disabled={loading}
                                                    filterProps={
                                                        setting.filterProps
                                                    }
                                                    operators={
                                                        setting.operators
                                                    }
                                                    onChange={(
                                                        change: FilterChange,
                                                    ) =>
                                                        onFilterChange(
                                                            field,
                                                            change,
                                                        )
                                                    }
                                                />
                                            )}
                                        </TableCell>
                                    );
                                })}
                            </TableRow>
                        )}
                    </TableHead>
                    <TableBody>
                        {rows.length === 0 && !loading && (
                            <TableRow>
                                <TableCell
                                    colSpan={columnCount}
                                    sx={{
                                        textAlign: 'center',
                                        py: 4,
                                        color: 'text.secondary',
                                    }}>
                                    {t('table:table.noRecords', 'No records')}
                                </TableCell>
                            </TableRow>
                        )}
                        {rows.map((row, idx) => {
                            const id = rowIds[idx];
                            const isSelected = selectedIds.has(id);
                            const expanded = expandable
                                ? (isRowExpanded?.(row, id) ??
                                  dbState.expanded?.includes(id) ??
                                  false)
                                : false;
                            const detail = renderDetail?.(row);
                            const dragDisabled = Boolean(
                                drag?.isDragDisabled?.(row),
                            );
                            const draggable = Boolean(drag) && !dragDisabled;
                            return (
                                <React.Fragment key={id}>
                                    <TableRow
                                        role='row'
                                        data-id={id}
                                        hover
                                        selected={isSelected}
                                        draggable={draggable}
                                        onDragStart={
                                            draggable
                                                ? () =>
                                                      setDragIndex(
                                                          rowOffset + idx,
                                                      )
                                                : undefined
                                        }
                                        onDragOver={
                                            drag
                                                ? (e) => e.preventDefault()
                                                : undefined
                                        }
                                        onDrop={
                                            drag
                                                ? () =>
                                                      onRowDrop(
                                                          rowOffset + idx,
                                                          row,
                                                      )
                                                : undefined
                                        }
                                        onClick={
                                            selectOnRowClick
                                                ? () => toggleSelection(id)
                                                : undefined
                                        }
                                        onDoubleClick={() =>
                                            handleRowDoubleClick(id, row)
                                        }
                                        sx={{
                                            cursor:
                                                selectOnRowClick ||
                                                onDoubleClick
                                                    ? 'pointer'
                                                    : 'default',
                                            ...((getRowSx?.(row) ??
                                                {}) as object),
                                        }}>
                                        {leadingColumns.map((kind) => {
                                            if (kind === 'drag') {
                                                return (
                                                    <TableCell
                                                        key='c-drag'
                                                        padding='none'
                                                        sx={{
                                                            textAlign: 'center',
                                                        }}>
                                                        {dragDisabled ? null : (
                                                            <DragIndicatorIcon
                                                                fontSize='small'
                                                                sx={{
                                                                    cursor: 'grab',
                                                                    color: 'text.secondary',
                                                                }}
                                                            />
                                                        )}
                                                    </TableCell>
                                                );
                                            }
                                            if (kind === 'expand') {
                                                return (
                                                    <TableCell
                                                        key='c-expand'
                                                        padding='none'
                                                        sx={{
                                                            textAlign: 'center',
                                                        }}>
                                                        <IconButton
                                                            size='small'
                                                            sx={{
                                                                transform: `rotate(${expanded ? 180 : 0}deg)`,
                                                                transition:
                                                                    'transform 0.3s ease-in-out',
                                                            }}
                                                            onClick={(
                                                                event,
                                                            ) => {
                                                                event.preventDefault();
                                                                event.stopPropagation();
                                                                onToggleExpand?.(
                                                                    row,
                                                                    id,
                                                                );
                                                            }}>
                                                            <ExpandMoreIcon fontSize='small' />
                                                        </IconButton>
                                                    </TableCell>
                                                );
                                            }
                                            return (
                                                <TableCell
                                                    key='c-select'
                                                    padding='checkbox'
                                                    sx={{
                                                        textAlign: 'center',
                                                    }}>
                                                    <Checkbox
                                                        size='small'
                                                        color='secondary'
                                                        checked={isSelected}
                                                        disabled={loading}
                                                        onClick={(e) =>
                                                            e.stopPropagation()
                                                        }
                                                        onChange={() =>
                                                            toggleSelection(id)
                                                        }
                                                    />
                                                </TableCell>
                                            );
                                        })}
                                        {visibleFields.map((field, colIdx) => {
                                            const setting =
                                                columnSettings[colIdx];
                                            const raw = row?.[field.field];
                                            /* `?? raw` here would put the untouched value —
                                             * an object among them — on screen whenever a
                                             * renderer deliberately returned nothing */
                                            const node = setting.renderValue
                                                ? setting.renderValue({
                                                      key: field.field,
                                                      value: raw,
                                                      data: row,
                                                  })
                                                : raw;
                                            return (
                                                <TableCell
                                                    key={`c-${field.field}`}
                                                    data-field={field.field}
                                                    sx={{
                                                        padding: '4px 8px',
                                                        borderRight: 1,
                                                        borderColor: 'divider',
                                                        textAlign:
                                                            field.align ??
                                                            'left',
                                                        ...(field.nowrap
                                                            ? {
                                                                  whiteSpace:
                                                                      'nowrap',
                                                                  overflow:
                                                                      'hidden',
                                                                  textOverflow:
                                                                      'ellipsis',
                                                              }
                                                            : {
                                                                  whiteSpace:
                                                                      'normal',
                                                                  wordBreak:
                                                                      'break-word',
                                                              }),
                                                    }}>
                                                    {node as ReactNode}
                                                </TableCell>
                                            );
                                        })}
                                    </TableRow>
                                    {detail ? (
                                        <TableRow
                                            data-detail-for={id}
                                            sx={{
                                                '&:hover': {
                                                    bgcolor: 'transparent',
                                                },
                                            }}>
                                            <TableCell
                                                colSpan={columnCount}
                                                sx={{ padding: 0, border: 0 }}>
                                                {detail}
                                            </TableCell>
                                        </TableRow>
                                    ) : null}
                                </React.Fragment>
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
            {!hidePaginator && (
                <CommonTablePaginator
                    skip={skip}
                    limit={limit}
                    count={count}
                    pageSizes={pageSizes}
                    disabled={loading}
                    onRefresh={() => updateDbState('limit', limit)}
                    onSkipChange={(next) => updateDbState('skip', next)}
                    onLimitChange={(next) => updateDbState('limit', next)}
                />
            )}
        </Box>
    );
};
