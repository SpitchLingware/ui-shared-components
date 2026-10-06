import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    effectiveHiddenColumns,
    readHiddenColumns,
    storeHiddenColumns,
    toggleHiddenColumn,
} from './column-visibility.utils';
import { TableField } from './types';

export type ColumnVisibility = {
    hidden: Array<string>;
    toggle: (field: string) => void;
    showAll: () => void;
};

export const useColumnVisibility = (
    storageKey: string,
    fields: Array<TableField>,
): ColumnVisibility => {
    const [stored, setStored] = useState<Array<string>>(() =>
        readHiddenColumns(storageKey),
    );

    useEffect(() => {
        setStored(readHiddenColumns(storageKey));
    }, [storageKey]);

    const hidden = useMemo(
        () => effectiveHiddenColumns(stored, fields),
        [stored, fields],
    );

    const toggle = useCallback(
        (field: string) => {
            const next = toggleHiddenColumn(stored, field, fields);
            if (next === stored) return;
            storeHiddenColumns(storageKey, next);
            setStored(next);
        },
        [stored, fields, storageKey],
    );

    const showAll = useCallback(() => {
        storeHiddenColumns(storageKey, []);
        setStored([]);
    }, [storageKey]);

    return { hidden, toggle, showAll };
};
