import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import SwapVertIcon from '@mui/icons-material/SwapVert';
import {
    Box,
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
import { CommonTablePaginator } from './CommonTablePaginator';
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
    fields: Array<TableField>;
    idProperty?: string;
    dbState: CommonTableV2State;
    dbData: CommonTableV2Data;
    onDoubleClick?: (id: string) => void;
    pageSizes?: number[];
    updateDbState: (field: keyof CommonTableV2State, value: any) => void;
    getColumnSettings: (field: TableField) => CommonTableV2ColumnSettings;
};

type ColumnWidths = Record<string, number>;

const DEFAULT_COL_WIDTH = 160;
const CHECKBOX_COL_WIDTH = 44;
const MIN_COL_WIDTH = 60;

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
        fields,
        idProperty = '_id',
        dbData,
        dbState,
        onDoubleClick,
        pageSizes,
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

    const [widths, setWidths] = useState<ColumnWidths>(() => {
        const initial: ColumnWidths = {};
        visibleFields.forEach((f) => {
            initial[f.field] =
                getStoredWidth(elementType, f.field) ?? DEFAULT_COL_WIDTH;
        });
        return initial;
    });

    useEffect(() => {
        setWidths((prev) => {
            const next: ColumnWidths = {};
            visibleFields.forEach((f) => {
                next[f.field] =
                    prev[f.field] ??
                    getStoredWidth(elementType, f.field) ??
                    DEFAULT_COL_WIDTH;
            });
            return next;
        });
    }, [elementType, visibleFields]);

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
                    elementType,
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
    }, [elementType, widths]);

    const startResize = (field: string, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        resizingRef.current = {
            field,
            startX: e.clientX,
            startWidth: widths[field] ?? DEFAULT_COL_WIDTH,
        };
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
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

    const totalColWidth =
        CHECKBOX_COL_WIDTH +
        visibleFields.reduce(
            (s, f) => s + (widths[f.field] ?? DEFAULT_COL_WIDTH),
            0,
        );

    const headerCellSx = {
        bgcolor: grey[100],
        position: 'sticky' as const,
        top: 0,
        zIndex: 2,
        padding: '4px 8px',
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
            <TableContainer
                sx={{
                    flex: 1,
                    overflow: 'auto',
                    opacity: loading ? 0.7 : 1,
                    pointerEvents: loading ? 'none' : 'auto',
                }}>
                <Table
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
                        <col style={{ width: CHECKBOX_COL_WIDTH }} />
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
                        <TableRow>
                            <TableCell
                                rowSpan={1}
                                sx={{
                                    ...headerCellSx,
                                    height: 32,
                                    textAlign: 'center',
                                }}
                            />
                            {visibleFields.map((field, idx) => {
                                const setting = columnSettings[idx];
                                const tag = field.i18nTag ?? field.field;
                                const sortable = setting.sortable ?? true;
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
                        {/* row 2: filters */}
                        <TableRow>
                            <TableCell
                                rowSpan={1}
                                sx={{
                                    ...headerCellSx,
                                    position: 'sticky',
                                    top: 32,
                                }}
                            />
                            {visibleFields.map((field, idx) => {
                                const setting = columnSettings[idx];
                                const FilterComp = setting.filter as
                                    | React.FC<any>
                                    | undefined;
                                const fv = findFilter(filter, field.field);
                                return (
                                    <TableCell
                                        key={`f-${field.field}`}
                                        sx={{
                                            ...headerCellSx,
                                            position: 'sticky',
                                            top: 32,
                                            padding: '2px 4px',
                                        }}>
                                        {FilterComp && fv && (
                                            <FilterComp
                                                filter={fv}
                                                disabled={loading}
                                                filterProps={
                                                    setting.filterProps
                                                }
                                                onChange={(
                                                    change: FilterChange,
                                                ) =>
                                                    onFilterChange(
                                                        field.field,
                                                        change,
                                                    )
                                                }
                                            />
                                        )}
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
                                    {t('table:table.noRecords', 'No records')}
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
                                        padding='checkbox'
                                        sx={{
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
