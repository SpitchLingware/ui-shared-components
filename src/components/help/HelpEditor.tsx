import {
    Code,
    FormatBold,
    FormatItalic,
    FormatListBulleted,
    FormatListNumbered,
    FormatUnderlined,
    Image,
    InsertLink,
} from '@mui/icons-material';
import {
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    IconButton,
    MenuItem,
    Stack,
    TextField,
    ToggleButton,
    ToggleButtonGroup,
} from '@mui/material';
import { FC, ReactNode, useLayoutEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    insertHtml,
    insertImage,
    serializeEditor,
    setBlock,
    toggleInline,
    toggleList,
    wrapLink,
} from './help.rte';
import { HelpLocale } from './help.types';

const escHtml = (s: string): string =>
    s
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');

export interface HelpEditorProps {
    value: string;
    onChange: (html: string) => void;
    placeholder?: string;
    locale?: HelpLocale;
    availableLocales?: HelpLocale[];
    onLocaleChange?: (locale: HelpLocale) => void;
    /** Разделы справки — цели для внутренних ссылок (help:<slug>) в тексте. */
    linkTargets?: { slug: string; title: string }[];
}

type Command =
    | { cmd: 'bold' }
    | { cmd: 'italic' }
    | { cmd: 'underline' }
    | { cmd: 'insertUnorderedList' }
    | { cmd: 'insertOrderedList' }
    | { cmd: 'formatBlock'; arg: string };

export const HelpEditor: FC<HelpEditorProps> = ({
    value,
    onChange,
    placeholder,
    locale,
    availableLocales,
    onLocaleChange,
    linkTargets,
}) => {
    const { t } = useTranslation('help');
    const ref = useRef<HTMLDivElement>(null);

    /* Синхронизируем DOM с контролируемым value. Сравниваем через serializeEditor
       (нормализует div→p), иначе наш же emit (нормализованный) отличался бы от
       живого DOM и сбрасывал бы содержимое на каждом вводе. */
    useLayoutEffect(() => {
        const el = ref.current;
        if (el && serializeEditor(el) !== (value || '')) {
            el.innerHTML = value || '';
        }
    }, [value]);

    const emit = () => {
        if (ref.current) onChange(serializeEditor(ref.current));
    };

    const run = (command: Command) => {
        const el = ref.current;
        if (!el) return;
        el.focus();
        switch (command.cmd) {
            case 'bold':
                toggleInline(el, 'strong');
                break;
            case 'italic':
                toggleInline(el, 'em');
                break;
            case 'underline':
                toggleInline(el, 'u');
                break;
            case 'insertUnorderedList':
                toggleList(el, false);
                break;
            case 'insertOrderedList':
                toggleList(el, true);
                break;
            case 'formatBlock': {
                const tag = command.arg.replace(/[<>]/g, '') as
                    | 'p'
                    | 'h1'
                    | 'h2'
                    | 'pre'
                    | 'blockquote';
                setBlock(el, tag);
                break;
            }
        }
        emit();
    };

    const savedRange = useRef<Range | null>(null);
    const [urlPrompt, setUrlPrompt] = useState<{
        cmd: 'createLink' | 'insertImage';
        labelKey: string;
    } | null>(null);
    const [urlValue, setUrlValue] = useState('');
    const [linkMode, setLinkMode] = useState<'external' | 'internal'>(
        'external',
    );
    const [internalSlug, setInternalSlug] = useState('');

    const canPickInternal = !!linkTargets && linkTargets.length > 0;

    const openInsert = (
        cmd: 'createLink' | 'insertImage',
        labelKey: string,
    ) => {
        const sel = window.getSelection();
        savedRange.current =
            sel && sel.rangeCount ? sel.getRangeAt(0).cloneRange() : null;
        setUrlValue('');
        setLinkMode('external');
        setInternalSlug('');
        setUrlPrompt({ cmd, labelKey });
    };

    const restoreSelection = () => {
        const el = ref.current;
        if (!el) return false;
        el.focus();
        const sel = window.getSelection();
        if (sel && savedRange.current) {
            sel.removeAllRanges();
            sel.addRange(savedRange.current);
        }
        return true;
    };

    const confirmInsert = () => {
        const prompt = urlPrompt;
        setUrlPrompt(null);
        if (!prompt) return;
        const el = ref.current;
        if (!el) return;
        restoreSelection();

        if (prompt.cmd === 'createLink' && linkMode === 'internal') {
            const slug = internalSlug;

            if (!slug) return;

            const href = `help:${slug}`;

            if (!wrapLink(el, href)) {
                const title =
                    linkTargets?.find((tt) => tt.slug === slug)?.title ?? slug;
                insertHtml(
                    el,
                    `<a href="${escHtml(href)}">${escHtml(title)}</a>`,
                );
            }
            emit();
            return;
        }

        const url = urlValue.trim();
        if (!url) return;

        if (prompt.cmd === 'insertImage') {
            insertImage(el, url);
        } else if (!wrapLink(el, url)) {
            insertHtml(el, `<a href="${escHtml(url)}">${escHtml(url)}</a>`);
        }
        emit();
    };

    const toolBtn = (title: string, icon: ReactNode, onClick: () => void) => (
        <IconButton
            size='small'
            title={title}
            onMouseDown={(e) => e.preventDefault()}
            onClick={onClick}>
            {icon}
        </IconButton>
    );

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
                overflow: 'hidden',
            }}>
            <Stack
                direction='row'
                alignItems='center'
                flexWrap='wrap'
                sx={{
                    gap: 0.25,
                    px: 1,
                    py: 0.5,
                    bgcolor: 'background.default',
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                }}>
                {toolBtn(
                    t('editor.bold', 'Bold'),
                    <FormatBold fontSize='small' />,
                    () => run({ cmd: 'bold' }),
                )}
                {toolBtn(
                    t('editor.italic', 'Italic'),
                    <FormatItalic fontSize='small' />,
                    () => run({ cmd: 'italic' }),
                )}
                {toolBtn(
                    t('editor.underline', 'Underline'),
                    <FormatUnderlined fontSize='small' />,
                    () => run({ cmd: 'underline' }),
                )}

                <Divider orientation='vertical' flexItem sx={{ mx: 0.5 }} />

                {toolBtn(
                    t('editor.h1', 'Heading 1'),
                    <Box sx={{ fontSize: 13, fontWeight: 600 }}>H1</Box>,
                    () => run({ cmd: 'formatBlock', arg: '<h1>' }),
                )}
                {toolBtn(
                    t('editor.h2', 'Heading 2'),
                    <Box sx={{ fontSize: 13, fontWeight: 600 }}>H2</Box>,
                    () => run({ cmd: 'formatBlock', arg: '<h2>' }),
                )}
                {toolBtn(
                    t('editor.paragraph', 'Paragraph'),
                    <Box sx={{ fontSize: 13 }}>¶</Box>,
                    () => run({ cmd: 'formatBlock', arg: '<p>' }),
                )}

                <Divider orientation='vertical' flexItem sx={{ mx: 0.5 }} />

                {toolBtn(
                    t('editor.bulletList', 'Bullet list'),
                    <FormatListBulleted fontSize='small' />,
                    () => run({ cmd: 'insertUnorderedList' }),
                )}
                {toolBtn(
                    t('editor.numberList', 'Numbered list'),
                    <FormatListNumbered fontSize='small' />,
                    () => run({ cmd: 'insertOrderedList' }),
                )}

                <Divider orientation='vertical' flexItem sx={{ mx: 0.5 }} />

                {toolBtn(
                    t('editor.link', 'Link'),
                    <InsertLink fontSize='small' />,
                    () => openInsert('createLink', 'editor.linkPrompt'),
                )}
                {toolBtn(
                    t('editor.image', 'Image'),
                    <Image fontSize='small' />,
                    () => openInsert('insertImage', 'editor.imagePrompt'),
                )}
                {toolBtn(
                    t('editor.code', 'Code'),
                    <Code fontSize='small' />,
                    () => run({ cmd: 'formatBlock', arg: '<pre>' }),
                )}

                {onLocaleChange &&
                    availableLocales &&
                    availableLocales.length > 1 && (
                        <ToggleButtonGroup
                            size='small'
                            exclusive
                            value={locale}
                            onChange={(_, next) => next && onLocaleChange(next)}
                            sx={{ ml: 'auto' }}>
                            {availableLocales.map((l) => (
                                <ToggleButton
                                    key={l}
                                    value={l}
                                    sx={{ px: 1, py: 0.25, fontSize: 12 }}>
                                    {l.toUpperCase()}
                                </ToggleButton>
                            ))}
                        </ToggleButtonGroup>
                    )}
            </Stack>

            <Box
                ref={ref}
                contentEditable
                suppressContentEditableWarning
                onInput={emit}
                data-placeholder={
                    placeholder ?? t('editor.placeholder', 'Enter text…')
                }
                sx={{
                    minHeight: 160,
                    p: 1.5,
                    fontSize: 14,
                    lineHeight: 1.6,
                    outline: 'none',
                    color: 'text.primary',
                    overflow: 'auto',
                    '&:empty::before': {
                        content: 'attr(data-placeholder)',
                        color: 'text.disabled',
                    },
                    '& h1': { fontSize: 22, fontWeight: 600, my: 1 },
                    '& h2': { fontSize: 18, fontWeight: 600, my: 1 },
                    '& ul, & ol': { pl: 3, my: 1 },
                    '& img': { maxWidth: '100%' },
                    '& pre': {
                        bgcolor: 'action.hover',
                        p: 1,
                        borderRadius: 1,
                        fontFamily: 'monospace',
                        fontSize: 13,
                    },
                }}
            />

            <Dialog
                open={!!urlPrompt}
                onClose={() => setUrlPrompt(null)}
                disableEnforceFocus
                disableRestoreFocus
                maxWidth='xs'
                fullWidth>
                <DialogTitle sx={{ fontSize: 16 }}>
                    {urlPrompt
                        ? t(urlPrompt.labelKey, 'Enter URL')
                        : t('editor.linkPrompt', 'Enter URL')}
                </DialogTitle>
                <DialogContent>
                    {urlPrompt?.cmd === 'createLink' && canPickInternal && (
                        <ToggleButtonGroup
                            size='small'
                            exclusive
                            value={linkMode}
                            onChange={(_, next) => next && setLinkMode(next)}
                            sx={{ mb: 1, mt: 0.5 }}>
                            <ToggleButton value='external' sx={{ px: 1.5 }}>
                                {t('editor.linkExternal', 'URL')}
                            </ToggleButton>
                            <ToggleButton value='internal' sx={{ px: 1.5 }}>
                                {t('editor.linkInternal', 'Section')}
                            </ToggleButton>
                        </ToggleButtonGroup>
                    )}

                    {urlPrompt?.cmd === 'createLink' &&
                    linkMode === 'internal' ? (
                        <TextField
                            select
                            autoFocus
                            fullWidth
                            size='small'
                            margin='dense'
                            label={t('editor.linkSection', 'Help section')}
                            value={internalSlug}
                            onChange={(e) => setInternalSlug(e.target.value)}>
                            {(linkTargets ?? []).map((tt) => (
                                <MenuItem key={tt.slug} value={tt.slug}>
                                    {tt.title}
                                </MenuItem>
                            ))}
                        </TextField>
                    ) : (
                        <TextField
                            autoFocus
                            fullWidth
                            size='small'
                            margin='dense'
                            placeholder='https://'
                            value={urlValue}
                            onChange={(e) => setUrlValue(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    confirmInsert();
                                }
                            }}
                        />
                    )}
                </DialogContent>
                <DialogActions>
                    <Button size='small' onClick={() => setUrlPrompt(null)}>
                        {t('actions.cancel', 'Cancel')}
                    </Button>
                    <Button
                        size='small'
                        variant='contained'
                        disabled={
                            urlPrompt?.cmd === 'createLink' &&
                            linkMode === 'internal'
                                ? !internalSlug
                                : !urlValue.trim()
                        }
                        onClick={confirmInsert}>
                        {t('actions.insert', 'Insert')}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};
