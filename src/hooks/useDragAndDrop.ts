import { cloneDeep, get } from 'lodash';
import { DragEvent, useCallback, useState } from 'react';
import { applyDragGhost, removeDragGhost } from '../utils';

export type UseDragAndDropProps<T, E = any> = {
    dataObject: E;
    compare?: (a: T, b: T) => boolean;
    getPath: (element: T) => string | number;
    onEnd: (update: E | undefined) => void;
};

export type DragAndDropData<T> = {
    draggedElement?: T;
    elementOver?: T;
    onDragStart: (event: DragEvent<HTMLElement>, element: T) => void;
    onDragOver: (event: DragEvent<HTMLElement>, element: T) => void;
    onDragLeave: (event: DragEvent<HTMLElement>, element: T) => void;
    onDragEnd: (event: DragEvent<HTMLElement>, element: T) => void;
};

export const parseBucketPath = (value: string | number): [string, number] => {
    if (typeof value === 'number') {
        return ['', value];
    }

    let path = '';
    let index = -1;
    const dot = value.lastIndexOf('.');
    if (dot === -1) {
        index = Number(value);
    } else {
        path = value.substring(0, dot);
        index = Number(value.substring(dot + 1));
    }
    return [path, index];
};

const plainCompare = (a: unknown, b: unknown): boolean => {
    return a === b;
};

export const useDragAndDrop = <T, E = any>(
    props: UseDragAndDropProps<T, E>,
): DragAndDropData<T> => {
    const { onEnd, compare = plainCompare, getPath, dataObject } = props;

    const [draggedElement, setDraggedElement] = useState<T | undefined>(
        undefined,
    );
    const [elementOver, setElementOver] = useState<T | undefined>(undefined);

    const applyChanges = (obj: E, from: T, to: T): E | undefined => {
        let [path1, idx1] = parseBucketPath(getPath(from));
        let [path2, idx2] = parseBucketPath(getPath(to));

        if (isNaN(idx1) || isNaN(idx2)) {
            console.warn('[drag done]: cannot process elements', { from, to });
            return undefined;
        }

        const update = cloneDeep(obj);

        const originArray: Array<any> = !path1 ? update : get(update, path1);
        const destinationArray: Array<any> = !path2
            ? update
            : get(update, path2);

        if (!Array.isArray(originArray) || !Array.isArray(destinationArray)) {
            console.warn('[drag done]: cannot check arrays', { from, to });
            return undefined;
        }

        const element = originArray.splice(idx1, 1);

        /* if */
        if (path1 === path2 && idx1 < idx2) {
            idx2--;
        }

        destinationArray.splice(idx2, 0, ...element);

        return update;
    };

    const onDragStart = useCallback(
        (event: DragEvent<HTMLElement>, element: T) => {
            applyDragGhost(event);
            setDraggedElement(element);
        },
        [],
    );

    const onDragEnd = (event: DragEvent<HTMLElement>, element: T) => {
        event.stopPropagation();
        if (
            draggedElement !== undefined &&
            elementOver !== undefined &&
            !compare(draggedElement, elementOver)
        ) {
            onEnd(applyChanges(dataObject, draggedElement, elementOver));
        }
        setDraggedElement(undefined);
        setElementOver(undefined);
        removeDragGhost();
    };

    const onDragOver = (event: DragEvent<HTMLElement>, element: T) => {
        event.stopPropagation();

        if (typeof draggedElement === undefined) return;
        if (elementOver && compare(elementOver, element)) return;
        setElementOver(element);
    };

    const onDragLeave = (event: DragEvent<HTMLElement>, element: T) => {
        event.stopPropagation();

        if (typeof draggedElement === undefined) return;
        if (elementOver && compare(elementOver, element)) {
            setElementOver(undefined);
        }
    };

    return {
        draggedElement,
        elementOver,
        onDragStart,
        onDragEnd,
        onDragOver,
        onDragLeave,
    };
};
