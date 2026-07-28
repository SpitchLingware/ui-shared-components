export interface HtmlSanitizePolicy {
    allowedTags: string[];
    allowedAttributes: Record<string, string[]>;
    hrefSchemes: string[];
    srcSchemes: string[];
    dangerousTags: string[];
}

const schemeOf = (value: string): string => {
    const v = value.replace(/[\s\x00-\x1F]+/g, '');
    const m = /^([a-z][a-z0-9+.-]*):/i.exec(v);
    return m ? m[1].toLowerCase() : '';
};

export const createHtmlSanitizer = (policy: HtmlSanitizePolicy) => {
    const allowedTags = new Set(policy.allowedTags.map((t) => t.toUpperCase()));
    const allowedAttrs: Record<string, Set<string>> = {};
    for (const [tag, attrs] of Object.entries(policy.allowedAttributes)) {
        allowedAttrs[tag.toUpperCase()] = new Set(
            attrs.map((a) => a.toLowerCase()),
        );
    }
    const hrefSchemes = new Set(policy.hrefSchemes.map((s) => s.toLowerCase()));
    const srcSchemes = new Set(policy.srcSchemes.map((s) => s.toLowerCase()));
    const dangerousSelector = policy.dangerousTags.join(',');

    return (html: string): string => {
        if (typeof window === 'undefined' || !window.DOMParser) return '';
        const doc = new DOMParser().parseFromString(html, 'text/html');

        if (dangerousSelector) {
            doc.body
                .querySelectorAll(dangerousSelector)
                .forEach((el) => el.remove());
        }

        doc.body.querySelectorAll('*').forEach((el) => {
            if (!el.isConnected) return;
            const tag = el.tagName;

            if (!allowedTags.has(tag)) {
                el.replaceWith(...Array.from(el.childNodes));
                return;
            }

            const allowed = allowedAttrs[tag];
            Array.from(el.attributes).forEach((attr) => {
                const name = attr.name.toLowerCase();
                if (!allowed || !allowed.has(name)) {
                    el.removeAttribute(attr.name);
                    return;
                }
                if (name === 'href' || name === 'src') {
                    const scheme = schemeOf(attr.value);
                    const schemes = name === 'href' ? hrefSchemes : srcSchemes;
                    if (scheme && !schemes.has(scheme)) {
                        el.removeAttribute(attr.name);
                    }
                }
            });

            if (tag === 'A' && el.getAttribute('target')) {
                el.setAttribute('rel', 'noopener noreferrer');
            }
        });

        return doc.body.innerHTML;
    };
};

export const FALLBACK_HTML_POLICY: HtmlSanitizePolicy = {
    allowedTags: [
        'p',
        'br',
        'b',
        'strong',
        'i',
        'em',
        'u',
        's',
        'h1',
        'h2',
        'h3',
        'ul',
        'ol',
        'li',
        'a',
        'pre',
        'code',
        'blockquote',
        'span',
        'img',
    ],
    allowedAttributes: {
        a: ['href', 'target', 'rel', 'name'],
        img: ['src', 'alt', 'title', 'width', 'height'],
    },
    hrefSchemes: ['http', 'https', 'mailto', 'tel', 'help'],
    srcSchemes: ['http', 'https', 'data'],
    dangerousTags: [
        'script',
        'style',
        'iframe',
        'object',
        'embed',
        'link',
        'meta',
        'noscript',
        'title',
        'textarea',
        'head',
        'base',
        'form',
        'input',
        'button',
        'svg',
        'math',
    ],
};
