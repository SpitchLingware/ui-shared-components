import React, { ReactNode } from 'react';
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
};

export type CommonTableV2Data<T = any> = {
    count: number;
    data: Array<T>;
    initial: boolean;
};

export type CommonTableV2State = {
    skip: number;
    limit: number;
    selected?: string;
    filter?: Array<CommonTableV2FilterValue>;
    sort?: CommonTableV2Sorting;
    loading?: boolean;
};
