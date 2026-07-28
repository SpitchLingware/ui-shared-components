import { grey } from '@mui/material/colors';
import { DragEvent } from 'react';

const DRAG_GHOST_ID = 'drag-ghost';

export const applyDragGhost = (event: DragEvent<HTMLElement>) => {
    event.dataTransfer.effectAllowed = 'move';
    event.stopPropagation();

    const { width } = ((event.target as HTMLElement).parentNode as HTMLElement).getClientRects()[0];
    const dragGhost = document.createElement('div');
    dragGhost.style.width = width + 'px';
    dragGhost.style.height = '32px';
    dragGhost.style.backgroundColor = grey[300];

    dragGhost.id = DRAG_GHOST_ID;
    dragGhost.style.position = 'absolute';
    dragGhost.style.top = '-1000px';

    document.body.appendChild(dragGhost);
    event.dataTransfer.setDragImage(dragGhost, 0, 16);
};

export const removeDragGhost = () => {
    const ghost = document.getElementById(DRAG_GHOST_ID);
    if (!ghost) return;

    if (ghost.parentNode) {
        ghost.parentNode.removeChild(ghost);
        return;
    }
};
