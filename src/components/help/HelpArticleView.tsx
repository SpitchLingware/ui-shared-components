import { LaunchOutlined } from '@mui/icons-material';
import { Box, Link, Typography } from '@mui/material';
import { FC, MouseEvent, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { createHtmlSanitizer, FALLBACK_HTML_POLICY } from './help.sanitize';
import { HelpNode } from './help.types';

export interface HelpArticleViewProps {
    node?: HelpNode;
    breadcrumb?: HelpNode[];
    sanitize?: (html: string) => string;
    onNavigate?: (slug: string) => void;
    knownSlugs?: Set<string>;
}

const defaultSanitize = createHtmlSanitizer(FALLBACK_HTML_POLICY);

const annotateInternalLinks = (
    html: string,
    knownSlugs?: Set<string>,
): string => {
    if (typeof window === 'undefined' || !window.DOMParser) return html;
    const doc = new DOMParser().parseFromString(html, 'text/html');
    doc.body.querySelectorAll('a[href]').forEach((a) => {
        const href = (a.getAttribute('href') || '').trim();
        const m = /^help:(.+)$/i.exec(href);
        if (!m) return;
        const slug = m[1];
        a.removeAttribute('href');
        a.setAttribute('data-help-slug', slug);
        if (knownSlugs && !knownSlugs.has(slug)) {
            a.setAttribute('data-help-broken', '');
        }
    });
    return doc.body.innerHTML;
};

export const HelpArticleView: FC<HelpArticleViewProps> = ({
    node,
    breadcrumb = [],
    sanitize = defaultSanitize,
    onNavigate,
    knownSlugs,
}) => {
    const { t } = useTranslation('help');

    const html = useMemo(
        () =>
            node?.body
                ? annotateInternalLinks(sanitize(node.body), knownSlugs)
                : '',
        [node?.body, sanitize, knownSlugs],
    );

    const handleClick = (e: MouseEvent<HTMLDivElement>) => {
        if (!(e.target instanceof HTMLElement)) return;
        const anchor = e.target.closest<HTMLElement>('a[data-help-slug]');
        if (!anchor) return;
        e.preventDefault();
        if (anchor.hasAttribute('data-help-broken')) return;
        const slug = anchor.getAttribute('data-help-slug');
        if (slug && onNavigate) onNavigate(slug);
    };

    if (!node) {
        return (
            <Box
                sx={{
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'text.disabled',
                    p: 4,
                    textAlign: 'center',
                }}>
                {t('article.empty', 'Select a section on the left')}
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3, overflow: 'auto', height: '100%' }}>
            {breadcrumb.length > 0 && (
                <Typography
                    variant='caption'
                    sx={{ color: 'text.disabled', display: 'block', mb: 1 }}>
                    {breadcrumb.map((n) => n.title).join(' / ')}
                </Typography>
            )}

            <Typography variant='h4' sx={{ mb: 1.5 }}>
                {node.title}
            </Typography>

            {node.type === 'link' && node.externalUrl && (
                <Link
                    href={node.externalUrl}
                    target='_blank'
                    rel='noopener noreferrer'
                    sx={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 0.5,
                    }}>
                    {node.externalUrl}
                    <LaunchOutlined fontSize='inherit' />
                </Link>
            )}

            {html ? (
                <Box
                    onClick={handleClick}
                    sx={{
                        color: 'text.primary',
                        fontSize: 14,
                        lineHeight: 1.6,
                        '& h1': { fontSize: 22, fontWeight: 600, mt: 2, mb: 1 },
                        '& h2': { fontSize: 18, fontWeight: 600, mt: 2, mb: 1 },
                        '& p': { my: 1 },
                        '& ul, & ol': { pl: 3, my: 1 },
                        '& li': { mb: 0.5 },
                        '& a': { color: 'primary.main' },
                        '& a[data-help-slug]': {
                            cursor: 'pointer',
                            textDecoration: 'underline',
                        },
                        '& a[data-help-broken]': {
                            color: 'text.disabled',
                            cursor: 'default',
                            textDecoration: 'line-through',
                        },
                        '& img': { maxWidth: '100%', borderRadius: 1 },
                        '& code': {
                            bgcolor: 'action.hover',
                            px: 0.5,
                            borderRadius: 0.5,
                            fontFamily: 'monospace',
                        },
                    }}
                    dangerouslySetInnerHTML={{ __html: html }}
                />
            ) : (
                node.type !== 'link' && (
                    <Typography
                        variant='body2'
                        sx={{ color: 'text.disabled', mt: 1 }}>
                        {t(
                            'article.noContent',
                            'This section has no content yet',
                        )}
                    </Typography>
                )
            )}
        </Box>
    );
};
