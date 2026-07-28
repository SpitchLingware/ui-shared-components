import {
    Add,
    ArrowDownward,
    ArrowUpward,
    ArticleOutlined,
    ChevronRight,
    DeleteOutline,
    ExpandMore,
    FolderOutlined,
    LinkOutlined,
    Search,
} from '@mui/icons-material';
import { Box, Collapse, IconButton, InputBase, Stack } from '@mui/material';
import { FC, MouseEvent, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { HelpNode } from './help.types';

export interface HelpTreeProps {
    nodes: HelpNode[];
    activeId?: string;
    onSelect: (id: string) => void;
    editable?: boolean;
    onAddNode?: (parentId: string | null) => void;
    onDeleteNode?: (id: string) => void;
    onReorder?: (id: string, direction: 'up' | 'down') => void;
}

const INDENT = 16;

const searchText = (node: HelpNode): string =>
    `${node.title} ${(node.body ?? '').replace(/<[^>]+>/g, ' ')}`.toLowerCase();

const matches = (node: HelpNode, q: string): boolean =>
    searchText(node).includes(q) ||
    node.children.some((child) => matches(child, q));

const filterTree = (nodes: HelpNode[], q: string): HelpNode[] => {
    if (!q) return nodes;
    return nodes
        .filter((n) => matches(n, q))
        .map((n) => ({ ...n, children: filterTree(n.children, q) }));
};

const typeIcon = (type: HelpNode['type']) => {
    switch (type) {
        case 'link':
            return <LinkOutlined fontSize='inherit' />;
        case 'section':
            return <FolderOutlined fontSize='inherit' />;
        default:
            return <ArticleOutlined fontSize='inherit' />;
    }
};

export const HelpTree: FC<HelpTreeProps> = ({
    nodes,
    activeId,
    onSelect,
    editable,
    onAddNode,
    onDeleteNode,
    onReorder,
}) => {
    const { t } = useTranslation('help');
    const [query, setQuery] = useState('');
    const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

    const q = query.trim().toLowerCase();
    const visible = useMemo(() => filterTree(nodes, q), [nodes, q]);

    const isExpanded = (id: string) => (q ? true : !collapsed.has(id));

    const toggle = (id: string) =>
        setCollapsed((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });

    const stop = (e: MouseEvent, fn: () => void) => {
        e.stopPropagation();
        fn();
    };

    const renderNode = (
        node: HelpNode,
        depth: number,
        siblings: HelpNode[],
    ) => {
        const hasChildren = node.children.length > 0;
        const active = node.id === activeId;
        const idx = siblings.findIndex((s) => s.id === node.id);

        return (
            <Box key={node.id}>
                <Box
                    onClick={() => onSelect(node.id)}
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.75,
                        pr: 1,
                        pl: `${depth * INDENT + 8}px`,
                        py: 0.75,
                        borderRadius: 1,
                        cursor: 'pointer',
                        color: active ? 'primary.main' : 'text.secondary',
                        bgcolor: active ? 'primary.lighter' : 'transparent',
                        fontWeight: node.type === 'section' ? 600 : 400,
                        fontSize: 13,
                        '&:hover': {
                            bgcolor: active
                                ? 'primary.lighter'
                                : 'action.hover',
                        },
                        '&:hover .help-tree-actions': { opacity: 1 },
                    }}>
                    <Box
                        onClick={(e) =>
                            hasChildren && stop(e, () => toggle(node.id))
                        }
                        sx={{
                            width: 16,
                            display: 'flex',
                            alignItems: 'center',
                            color: 'text.disabled',
                            fontSize: 16,
                        }}>
                        {hasChildren &&
                            (isExpanded(node.id) ? (
                                <ExpandMore fontSize='inherit' />
                            ) : (
                                <ChevronRight fontSize='inherit' />
                            ))}
                    </Box>

                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            fontSize: 15,
                            color: active ? 'primary.main' : 'text.disabled',
                        }}>
                        {typeIcon(node.type)}
                    </Box>

                    <Box
                        sx={{
                            flex: 1,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                        }}>
                        {node.title}
                    </Box>

                    {editable && (
                        <Stack
                            direction='row'
                            className='help-tree-actions'
                            sx={{ opacity: 0, transition: 'opacity .15s' }}>
                            {!q && onReorder && idx > 0 && (
                                <IconButton
                                    size='small'
                                    onClick={(e) =>
                                        stop(e, () => onReorder(node.id, 'up'))
                                    }>
                                    <ArrowUpward sx={{ fontSize: 14 }} />
                                </IconButton>
                            )}
                            {!q && onReorder && idx < siblings.length - 1 && (
                                <IconButton
                                    size='small'
                                    onClick={(e) =>
                                        stop(e, () =>
                                            onReorder(node.id, 'down'),
                                        )
                                    }>
                                    <ArrowDownward sx={{ fontSize: 14 }} />
                                </IconButton>
                            )}
                            {onAddNode && (
                                <IconButton
                                    size='small'
                                    title={t('tree.addChild', 'Add inside')}
                                    onClick={(e) =>
                                        stop(e, () => onAddNode(node.id))
                                    }>
                                    <Add sx={{ fontSize: 14 }} />
                                </IconButton>
                            )}
                            {onDeleteNode && (
                                <IconButton
                                    size='small'
                                    title={t('tree.delete', 'Delete')}
                                    onClick={(e) =>
                                        stop(e, () => onDeleteNode(node.id))
                                    }>
                                    <DeleteOutline sx={{ fontSize: 14 }} />
                                </IconButton>
                            )}
                        </Stack>
                    )}
                </Box>

                {hasChildren && (
                    <Collapse in={isExpanded(node.id)} unmountOnExit>
                        {node.children.map((child) =>
                            renderNode(child, depth + 1, node.children),
                        )}
                    </Collapse>
                )}
            </Box>
        );
    };

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                overflow: 'hidden',
            }}>
            <Box sx={{ p: 1 }}>
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        px: 1.25,
                        py: 0.75,
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 1,
                        bgcolor: 'background.paper',
                        color: 'text.disabled',
                    }}>
                    <Search fontSize='small' />
                    <InputBase
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder={t('tree.search', 'Search help…')}
                        sx={{ fontSize: 13, flex: 1 }}
                    />
                </Box>
            </Box>

            <Box sx={{ flex: 1, overflow: 'auto', px: 1, pb: 1 }}>
                {visible.map((node) => renderNode(node, 0, visible))}
            </Box>

            {editable && onAddNode && (
                <Box
                    onClick={() => onAddNode(null)}
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.75,
                        px: 2,
                        py: 1,
                        cursor: 'pointer',
                        color: 'text.disabled',
                        fontSize: 13,
                        borderTop: '1px solid',
                        borderColor: 'divider',
                        '&:hover': { color: 'primary.main' },
                    }}>
                    <Add fontSize='small' />
                    {t('tree.addSection', 'New section')}
                </Box>
            )}
        </Box>
    );
};
