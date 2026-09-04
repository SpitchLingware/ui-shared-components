import {
    Add,
    Close,
    EditOutlined,
    FileDownloadOutlined,
    FileUploadOutlined,
    HelpOutline,
    SaveOutlined,
    ShareOutlined,
    VisibilityOutlined,
} from '@mui/icons-material';
import {
    Box,
    Button,
    Chip,
    CircularProgress,
    Dialog,
    IconButton,
    MenuItem,
    Stack,
    TextField,
    Typography,
    useMediaQuery,
} from '@mui/material';
import { Theme } from '@mui/material/styles';
import {
    ChangeEvent,
    FC,
    PointerEvent as ReactPointerEvent,
    ReactNode,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import { HelpArticleView } from './HelpArticleView';
import { HelpEditor } from './HelpEditor';
import { HelpTree } from './HelpTree';
import { HelpLocale, HelpMode, HelpNode } from './help.types';

export interface HelpDialogProps {
    open: boolean;
    mode: HelpMode;
    nodes: HelpNode[];
    activeId?: string;
    breadcrumb?: HelpNode[];
    locale: HelpLocale;
    availableLocales?: HelpLocale[];
    loading?: boolean;
    canEdit: boolean;

    onClose: () => void;
    onSelect: (id: string) => void;
    onModeChange: (mode: HelpMode) => void;
    onLocaleChange: (locale: HelpLocale) => void;
    onShare: (node: HelpNode) => void;

    onSave: (nodeId: string, patch: Partial<HelpNode>) => void;
    onAddNode: (parentId: string | null) => void;
    onDeleteNode: (nodeId: string) => void;
    onReorder: (nodeId: string, direction: 'up' | 'down') => void;

    onExport?: () => void;
    onImport?: (file: File) => void;
    importAccept?: string;
    transferBusy?: boolean;

    renderEditor?: (props: {
        value: string;
        onChange: (html: string) => void;
    }) => ReactNode;
    sanitize?: (html: string) => string;
}

const TREE_WIDTH_STORAGE_KEY = 'omni.help.treeWidth';
const TREE_WIDTH_DEFAULT = 300;
const TREE_WIDTH_MIN = 200;
const TREE_WIDTH_MAX = 560;

const readStoredTreeWidth = (): number => {
    if (typeof window === 'undefined') return TREE_WIDTH_DEFAULT;
    const raw = window.localStorage.getItem(TREE_WIDTH_STORAGE_KEY);
    const parsed = raw ? Number(raw) : NaN;
    if (!Number.isFinite(parsed)) return TREE_WIDTH_DEFAULT;
    return Math.min(TREE_WIDTH_MAX, Math.max(TREE_WIDTH_MIN, parsed));
};

const MOBILE_TABS: Array<'tree' | 'content'> = ['tree', 'content'];

const findNode = (nodes: HelpNode[], id?: string): HelpNode | undefined => {
    if (!id) return undefined;
    for (const node of nodes) {
        if (node.id === id) return node;
        const found = findNode(node.children, id);
        if (found) return found;
    }
    return undefined;
};

const normalizeSlug = (value: string) =>
    value.toLowerCase().replace(/\s+/g, '-');

export const HelpDialog: FC<HelpDialogProps> = ({
    open,
    mode,
    nodes,
    activeId,
    breadcrumb,
    locale,
    availableLocales = ['en', 'ru'],
    loading,
    canEdit,
    onClose,
    onSelect,
    onModeChange,
    onLocaleChange,
    onShare,
    onSave,
    onAddNode,
    onDeleteNode,
    onReorder,
    onExport,
    onImport,
    importAccept = '.zip',
    transferBusy,
    renderEditor,
    sanitize,
}) => {
    const { t } = useTranslation('help');
    const isMobile = useMediaQuery((theme: Theme) =>
        theme.breakpoints.down('sm'),
    );
    const [mobileTab, setMobileTab] = useState<'tree' | 'content'>('content');

    const [treeWidth, setTreeWidth] = useState<number>(readStoredTreeWidth);
    const layoutRef = useRef<HTMLDivElement>(null);
    const treeWidthRef = useRef(treeWidth);
    const importInputRef = useRef<HTMLInputElement>(null);

    const handleImportPick = (event: ChangeEvent<HTMLInputElement>): void => {
        const file = event.target.files?.[0];
        event.target.value = '';
        if (file) onImport?.(file);
    };

    const startTreeResize = (e: ReactPointerEvent<HTMLDivElement>) => {
        if (isMobile) return;
        e.preventDefault();
        const onMove = (ev: PointerEvent) => {
            const layout = layoutRef.current;
            if (!layout) return;
            const left = layout.getBoundingClientRect().left;
            const next = Math.min(
                TREE_WIDTH_MAX,
                Math.max(TREE_WIDTH_MIN, ev.clientX - left),
            );
            treeWidthRef.current = next;
            setTreeWidth(next);
        };
        const onUp = () => {
            window.removeEventListener('pointermove', onMove);
            window.removeEventListener('pointerup', onUp);
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
            window.localStorage.setItem(
                TREE_WIDTH_STORAGE_KEY,
                String(Math.round(treeWidthRef.current)),
            );
        };
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
        window.addEventListener('pointermove', onMove);
        window.addEventListener('pointerup', onUp);
    };

    const activeNode = findNode(nodes, activeId);
    const isEdit = mode === 'edit' && canEdit;

    const [draftTitle, setDraftTitle] = useState('');
    const [draftBody, setDraftBody] = useState('');
    const [draftSlug, setDraftSlug] = useState('');
    const [draftType, setDraftType] = useState<HelpNode['type']>('article');
    const [draftParentId, setDraftParentId] = useState<string | null>(null);
    const [draftContextKey, setDraftContextKey] = useState('');
    const [draftIcon, setDraftIcon] = useState('');
    const [draftExternalUrl, setDraftExternalUrl] = useState('');

    useEffect(() => {
        setDraftTitle(activeNode?.title ?? '');
        setDraftBody(activeNode?.body ?? '');
        setDraftSlug(activeNode?.slug ?? '');
        setDraftType(activeNode?.type ?? 'article');
        setDraftParentId(activeNode?.parentId ?? null);
        setDraftContextKey(activeNode?.contextKey ?? '');
        setDraftIcon(activeNode?.icon ?? '');
        setDraftExternalUrl(activeNode?.externalUrl ?? '');
    }, [
        activeNode?.id,
        mode,
        locale,
        activeNode?.title,
        activeNode?.body,
        activeNode?.slug,
        activeNode?.type,
        activeNode?.parentId,
        activeNode?.contextKey,
        activeNode?.icon,
        activeNode?.externalUrl,
    ]);

    useEffect(() => {
        if (activeId) setMobileTab('content');
    }, [activeId]);

    const handleSelect = (id: string) => {
        if (id === activeId) return;
        commitIfDirty();
        onSelect(id);
        if (isMobile) setMobileTab('content');
    };

    const slugInvalid = !draftSlug.trim();

    const contextKeyDuplicate = useMemo(() => {
        const key = draftContextKey.trim();
        if (!key) return false;
        let dup = false;
        const walk = (list: HelpNode[]) =>
            list.forEach((n) => {
                if (n.id !== activeId && n.contextKey === key) dup = true;
                walk(n.children);
            });
        walk(nodes);
        return dup;
    }, [draftContextKey, nodes, activeId]);

    const saveInvalid = slugInvalid || contextKeyDuplicate;

    const parentOptions = useMemo(() => {
        const banned = new Set<string>();
        if (activeId) {
            banned.add(activeId);
            const collect = (n?: HelpNode) =>
                n?.children.forEach((c) => {
                    banned.add(c.id);
                    collect(c);
                });
            collect(activeNode);
        }
        const opts: { id: string; label: string }[] = [];
        const walk = (list: HelpNode[], depth: number) =>
            list.forEach((n) => {
                if (n.type === 'section' && !banned.has(n.id))
                    opts.push({
                        id: n.id,
                        label: `${'— '.repeat(depth)}${n.title}`,
                    });
                walk(n.children, depth + 1);
            });
        walk(nodes, 0);
        return opts;
    }, [nodes, activeId, activeNode]);

    const linkMaps = useMemo(() => {
        const slugToId = new Map<string, string>();
        const knownSlugs = new Set<string>();
        const targets: { slug: string; title: string }[] = [];
        const walk = (list: HelpNode[]) =>
            list.forEach((n) => {
                if (n.slug) {
                    slugToId.set(n.slug, n.id);
                    knownSlugs.add(n.slug);
                    targets.push({ slug: n.slug, title: n.title });
                }
                walk(n.children);
            });
        walk(nodes);
        targets.sort((a, b) => a.title.localeCompare(b.title));
        return { slugToId, knownSlugs, targets };
    }, [nodes]);

    const dirty =
        !!activeNode &&
        (draftTitle !== (activeNode.title ?? '') ||
            draftBody !== (activeNode.body ?? '') ||
            draftSlug !== (activeNode.slug ?? '') ||
            draftType !== activeNode.type ||
            (draftParentId ?? null) !== (activeNode.parentId ?? null) ||
            draftContextKey !== (activeNode.contextKey ?? '') ||
            draftIcon !== (activeNode.icon ?? '') ||
            draftExternalUrl !== (activeNode.externalUrl ?? ''));

    const handleSave = () => {
        if (activeId && !saveInvalid)
            onSave(activeId, {
                title: draftTitle,
                slug: draftSlug,
                body: draftBody,
                type: draftType,
                parentId: draftParentId,
                contextKey: draftContextKey.trim() || undefined,
                icon: draftIcon.trim() || undefined,
                externalUrl: draftExternalUrl.trim() || undefined,
            });
    };

    const commitIfDirty = () => {
        if (isEdit && activeId && dirty && !saveInvalid) handleSave();
    };

    const handleClose = () => {
        commitIfDirty();
        onClose();
    };

    const handleToggleMode = () => {
        if (isEdit) commitIfDirty();
        onModeChange(isEdit ? 'read' : 'edit');
    };

    const handleEditorLocaleChange = (next: HelpLocale) => {
        commitIfDirty();
        onLocaleChange(next);
    };

    const showTree = !isMobile || mobileTab === 'tree';
    const showContent = !isMobile || mobileTab === 'content';
    const showLoader = loading && nodes.length === 0;

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            maxWidth='lg'
            fullWidth
            slotProps={{ paper: { sx: { height: '82vh' } } }}>
            <Stack
                direction='row'
                alignItems='center'
                spacing={1}
                sx={{
                    px: 2,
                    py: 1.5,
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                }}>
                <HelpOutline color='primary' />
                <Typography variant='h5' sx={{ fontWeight: 600 }}>
                    {t('title', 'Help')}
                </Typography>

                <Box sx={{ flex: 1 }} />

                {!isEdit && activeNode && (
                    <Button
                        size='small'
                        variant='outlined'
                        startIcon={<ShareOutlined />}
                        onClick={() => onShare(activeNode)}>
                        {t('actions.share', 'Share')}
                    </Button>
                )}

                {isEdit ? (
                    <Chip
                        size='small'
                        color='warning'
                        variant='outlined'
                        label={t('mode.edit', 'Editing')}
                    />
                ) : (
                    <Chip
                        size='small'
                        color='success'
                        variant='outlined'
                        label={t('mode.read', 'Reading')}
                    />
                )}

                {canEdit && (
                    <Button
                        size='small'
                        color={isEdit ? 'inherit' : 'primary'}
                        startIcon={
                            isEdit ? <VisibilityOutlined /> : <EditOutlined />
                        }
                        onClick={handleToggleMode}>
                        {isEdit
                            ? t('actions.read', 'Read')
                            : t('actions.edit', 'Edit')}
                    </Button>
                )}

                {isEdit && (
                    <Button
                        size='small'
                        variant='outlined'
                        startIcon={<Add />}
                        onClick={() => onAddNode(null)}>
                        {t('actions.addSection', 'Section')}
                    </Button>
                )}

                {isEdit && onExport && (
                    <Button
                        size='small'
                        variant='outlined'
                        startIcon={<FileDownloadOutlined />}
                        disabled={transferBusy}
                        onClick={onExport}>
                        {t('actions.export', 'Export')}
                    </Button>
                )}

                {isEdit && onImport && (
                    <Button
                        size='small'
                        variant='outlined'
                        startIcon={<FileUploadOutlined />}
                        disabled={transferBusy}
                        onClick={() => importInputRef.current?.click()}>
                        {t('actions.import', 'Import')}
                    </Button>
                )}

                {isEdit && activeNode && (
                    <Button
                        size='small'
                        variant='contained'
                        startIcon={<SaveOutlined />}
                        disabled={saveInvalid}
                        onClick={handleSave}>
                        {t('actions.save', 'Save')}
                    </Button>
                )}

                <IconButton onClick={handleClose} size='small'>
                    <Close />
                </IconButton>

                {onImport && (
                    <input
                        ref={importInputRef}
                        type='file'
                        hidden
                        accept={importAccept}
                        onChange={handleImportPick}
                    />
                )}
            </Stack>

            {isMobile && !showLoader && (
                <Stack
                    direction='row'
                    sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
                    {MOBILE_TABS.map((tab) => (
                        <Box
                            key={tab}
                            onClick={() => setMobileTab(tab)}
                            sx={{
                                flex: 1,
                                textAlign: 'center',
                                py: 1,
                                fontSize: 13,
                                cursor: 'pointer',
                                color:
                                    mobileTab === tab
                                        ? 'primary.main'
                                        : 'text.secondary',
                                borderBottom: '2px solid',
                                borderColor:
                                    mobileTab === tab
                                        ? 'primary.main'
                                        : 'transparent',
                            }}>
                            {tab === 'tree'
                                ? t('tabs.contents', 'Contents')
                                : t('tabs.article', 'Article')}
                        </Box>
                    ))}
                </Stack>
            )}

            {showLoader ? (
                <Box
                    sx={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}>
                    <CircularProgress />
                </Box>
            ) : (
                <Box
                    ref={layoutRef}
                    sx={{ display: 'flex', flex: 1, minHeight: 0 }}>
                    {showTree && (
                        <Box
                            sx={{
                                width: isMobile ? '100%' : treeWidth,
                                flex: 'none',
                                borderRight: isMobile ? 'none' : '1px solid',
                                borderColor: 'divider',
                                bgcolor: 'background.default',
                                minHeight: 0,
                            }}>
                            <HelpTree
                                nodes={nodes}
                                activeId={activeId}
                                onSelect={handleSelect}
                                editable={isEdit}
                                onAddNode={onAddNode}
                                onDeleteNode={onDeleteNode}
                                onReorder={onReorder}
                            />
                        </Box>
                    )}

                    {!isMobile && showTree && showContent && (
                        <Box
                            onPointerDown={startTreeResize}
                            role='separator'
                            aria-orientation='vertical'
                            sx={{
                                flex: 'none',
                                width: 7,
                                ml: '-4px',
                                zIndex: 1,
                                cursor: 'col-resize',
                                position: 'relative',
                                '&::after': {
                                    content: '""',
                                    position: 'absolute',
                                    top: 0,
                                    bottom: 0,
                                    left: '50%',
                                    width: '2px',
                                    transform: 'translateX(-50%)',
                                    bgcolor: 'transparent',
                                    transition: 'background-color 0.15s',
                                },
                                '&:hover::after, &:active::after': {
                                    bgcolor: 'primary.main',
                                },
                            }}
                        />
                    )}

                    {showContent && (
                        <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
                            {isEdit && activeNode ? (
                                <Box sx={{ p: 3 }}>
                                    {breadcrumb && breadcrumb.length > 0 && (
                                        <Typography
                                            variant='caption'
                                            sx={{
                                                color: 'text.disabled',
                                                display: 'block',
                                                mb: 1,
                                            }}>
                                            {breadcrumb
                                                .map((n) => n.title)
                                                .join(' / ')}
                                        </Typography>
                                    )}
                                    <TextField
                                        fullWidth
                                        size='small'
                                        label={t('editor.titleLabel', 'Title')}
                                        value={draftTitle}
                                        onChange={(e) =>
                                            setDraftTitle(e.target.value)
                                        }
                                        sx={{ mb: 2 }}
                                    />
                                    <TextField
                                        fullWidth
                                        size='small'
                                        label={t(
                                            'editor.slugLabel',
                                            'Identifier (slug)',
                                        )}
                                        value={draftSlug}
                                        error={slugInvalid}
                                        onChange={(e) =>
                                            setDraftSlug(
                                                normalizeSlug(e.target.value),
                                            )
                                        }
                                        helperText={
                                            slugInvalid
                                                ? t(
                                                      'editor.slugRequired',
                                                      'Slug is required',
                                                  )
                                                : t(
                                                      'editor.slugHelp',
                                                      'Used in the ?help=<slug> link',
                                                  )
                                        }
                                        sx={{ mb: 2 }}
                                    />

                                    <Stack
                                        direction={{ xs: 'column', sm: 'row' }}
                                        spacing={2}
                                        sx={{ mb: 2 }}>
                                        <TextField
                                            select
                                            fullWidth
                                            size='small'
                                            label={t(
                                                'editor.typeLabel',
                                                'Type',
                                            )}
                                            value={draftType}
                                            onChange={(e) => {
                                                const v = e.target.value;
                                                if (
                                                    v === 'section' ||
                                                    v === 'article'
                                                ) {
                                                    setDraftType(v);
                                                }
                                            }}>
                                            <MenuItem value='section'>
                                                {t(
                                                    'editor.type.section',
                                                    'Section',
                                                )}
                                            </MenuItem>
                                            <MenuItem value='article'>
                                                {t(
                                                    'editor.type.article',
                                                    'Article',
                                                )}
                                            </MenuItem>
                                            <MenuItem value='link'>
                                                {t('editor.type.link', 'Link')}
                                            </MenuItem>
                                        </TextField>
                                        <TextField
                                            select
                                            fullWidth
                                            size='small'
                                            label={t(
                                                'editor.parentLabel',
                                                'Parent section',
                                            )}
                                            value={draftParentId ?? ''}
                                            onChange={(e) =>
                                                setDraftParentId(
                                                    e.target.value || null,
                                                )
                                            }>
                                            <MenuItem value=''>
                                                {t(
                                                    'editor.parentRoot',
                                                    '— Root —',
                                                )}
                                            </MenuItem>
                                            {parentOptions.map((o) => (
                                                <MenuItem
                                                    key={o.id}
                                                    value={o.id}>
                                                    {o.label}
                                                </MenuItem>
                                            ))}
                                        </TextField>
                                    </Stack>

                                    <Stack
                                        direction={{ xs: 'column', sm: 'row' }}
                                        spacing={2}
                                        sx={{ mb: 2 }}>
                                        <TextField
                                            fullWidth
                                            size='small'
                                            label={t(
                                                'editor.contextKeyLabel',
                                                'Context key',
                                            )}
                                            value={draftContextKey}
                                            error={contextKeyDuplicate}
                                            onChange={(e) =>
                                                setDraftContextKey(
                                                    e.target.value,
                                                )
                                            }
                                            helperText={
                                                contextKeyDuplicate
                                                    ? t(
                                                          'editor.contextKeyDup',
                                                          'This context key is already used',
                                                      )
                                                    : t(
                                                          'editor.contextKeyHelp',
                                                          'Binds the “?” anchor on a block/collection',
                                                      )
                                            }
                                        />
                                        <TextField
                                            fullWidth
                                            size='small'
                                            label={t(
                                                'editor.iconLabel',
                                                'Icon (MUI name)',
                                            )}
                                            value={draftIcon}
                                            onChange={(e) =>
                                                setDraftIcon(e.target.value)
                                            }
                                        />
                                    </Stack>

                                    {draftType === 'link' && (
                                        <TextField
                                            fullWidth
                                            size='small'
                                            label={t(
                                                'editor.externalUrlLabel',
                                                'External URL',
                                            )}
                                            placeholder='https://'
                                            value={draftExternalUrl}
                                            onChange={(e) =>
                                                setDraftExternalUrl(
                                                    e.target.value,
                                                )
                                            }
                                            sx={{ mb: 2 }}
                                        />
                                    )}

                                    {renderEditor ? (
                                        renderEditor({
                                            value: draftBody,
                                            onChange: setDraftBody,
                                        })
                                    ) : (
                                        <HelpEditor
                                            value={draftBody}
                                            onChange={setDraftBody}
                                            locale={locale}
                                            availableLocales={availableLocales}
                                            onLocaleChange={
                                                handleEditorLocaleChange
                                            }
                                            linkTargets={linkMaps.targets}
                                        />
                                    )}
                                </Box>
                            ) : (
                                <HelpArticleView
                                    node={activeNode}
                                    breadcrumb={breadcrumb}
                                    sanitize={sanitize}
                                    knownSlugs={linkMaps.knownSlugs}
                                    onNavigate={(slug) => {
                                        const id = linkMaps.slugToId.get(slug);
                                        if (id) handleSelect(id);
                                    }}
                                />
                            )}
                        </Box>
                    )}
                </Box>
            )}
        </Dialog>
    );
};
