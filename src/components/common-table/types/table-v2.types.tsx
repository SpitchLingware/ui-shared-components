import { SxProps, Theme } from '@mui/material';
import React, { ReactNode } from 'react';
import { OperatorOption } from './filter.types';
import { TableFieldParams } from './table-v2.fields';

export type CommonTableV2Sorting = {
    dir: 1 | -1;
    id: string;
    name: string;
};

export declare type CommonTableV2FilterValue = {
    name: string;
    type: string;
    operator: string;
    value: any;
};

export type CommonTableV2ColumnSettings = {
    /* filter react component; omit to render a column without a filter */
    filter?: typeof React.Component | React.FC<any>;
    filterProps: any;
    /** use this for new developments */
    renderValue?: (params: TableFieldParams) => ReactNode;

    sortable?: boolean;
    /**
     * Narrows the operator menu of this column's filter. Without it every filter offers its
     * whole built-in list, including operators the consumer's query builder cannot express —
     * such a choice looks applied and silently changes nothing.
     */
    operators?: Array<OperatorOption>;
};

export type CommonTableV2Data<T = any> = {
    count: number;
    data: Array<T>;
    initial: boolean;
};

export type CommonTableV2State = {
    skip: number;
    limit: number;
    /** a single id, or a list of them when the table runs with `multiSelect` */
    selected?: string | Array<string>;
    filter?: Array<CommonTableV2FilterValue>;
    sort?: CommonTableV2Sorting;
    loading?: boolean;
    /** ids of the rows whose detail panel is open */
    expanded?: Array<string>;
};

export type CommonTableV2RowDrag<T = any> = {
    /** called with the source and target row indexes of a completed drag */
    onRowOrderChange: (fromIndex: number, toIndex: number) => void;
    /** rows this returns true for get no grab handle and cannot be dropped onto */
    isDragDisabled?: (row: T) => boolean;
};

/** `id` is the identity the table resolved for the row - recomputing it elsewhere diverges */
export type CommonTableV2RowSx = (
    row: any,
    id: string,
) => SxProps<Theme> | undefined;
