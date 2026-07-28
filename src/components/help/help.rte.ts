type InlineTag = 'strong' | 'em' | 'u' | 's';
type BlockTag = 'p' | 'h1' | 'h2' | 'pre' | 'blockquote';

const SIMPLE_BLOCKS = new Set([
    'P',
    'DIV',
    'H1',
    'H2',
    'H3',
    'PRE',
    'BLOCKQUOTE',
]);

const getCtx = (root: HTMLElement): { sel: Selection; range: Range } | null => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return null;
    const range = sel.getRangeAt(0);
    const anc = range.commonAncestorContainer;
    if (anc !== root && !root.contains(anc)) return null;
    return { sel, range };
};

const selectContents = (sel: Selection, node: Node): void => {
    const r = document.createRange();
    r.selectNodeContents(node);
    sel.removeAllRanges();
    sel.addRange(r);
};

const closestTag = (
    node: Node | null,
    tag: string,
    root: HTMLElement,
): HTMLElement | null => {
    const upper = tag.toUpperCase();
    let n: Node | null = node;
    while (n && n !== root) {
        if (n instanceof HTMLElement && n.tagName === upper) {
            return n;
        }
        n = n.parentNode;
    }
    return null;
};

const topBlock = (root: HTMLElement, node: Node | null): HTMLElement | null => {
    let n: Node | null = node;
    while (n && n.parentNode !== root) n = n.parentNode;
    return n && n.parentNode === root && n instanceof HTMLElement ? n : null;
};

const selectedTopBlocks = (root: HTMLElement, range: Range): HTMLElement[] => {
    const start = topBlock(root, range.startContainer);
    const end = topBlock(root, range.endContainer);
    if (!start || !end) return [];
    const blocks: HTMLElement[] = [];
    let cur: Node | null = start;
    while (cur) {
        if (cur instanceof HTMLElement) blocks.push(cur);
        if (cur === end) break;
        cur = cur.nextSibling;
    }
    return blocks;
};

const replaceTag = (el: HTMLElement, tag: string): HTMLElement => {
    const next = document.createElement(tag);
    while (el.firstChild) next.appendChild(el.firstChild);
    el.replaceWith(next);
    return next;
};

export const toggleInline = (root: HTMLElement, tag: InlineTag): void => {
    const ctx = getCtx(root);
    if (!ctx || ctx.range.collapsed) return;
    const { sel, range } = ctx;

    const startEl = closestTag(range.startContainer, tag, root);
    const endEl = closestTag(range.endContainer, tag, root);

    if (startEl && startEl === endEl) {
        const parent = startEl.parentNode;
        if (!parent) return;
        const first = startEl.firstChild;
        const last = startEl.lastChild;
        while (startEl.firstChild)
            parent.insertBefore(startEl.firstChild, startEl);
        parent.removeChild(startEl);
        if (first && last) {
            const r = document.createRange();
            r.setStartBefore(first);
            r.setEndAfter(last);
            sel.removeAllRanges();
            sel.addRange(r);
        }
        parent.normalize();
        return;
    }

    const el = document.createElement(tag);
    try {
        range.surroundContents(el);
    } catch {
        el.appendChild(range.extractContents());
        range.insertNode(el);
    }
    selectContents(sel, el);
};

export const setBlock = (root: HTMLElement, tag: BlockTag): void => {
    const ctx = getCtx(root);
    if (!ctx) return;
    const { sel, range } = ctx;

    let blocks = selectedTopBlocks(root, range);

    if (!blocks.length) {
        if (!root.firstChild) return;
        const wrapper = document.createElement(tag);
        while (root.firstChild) wrapper.appendChild(root.firstChild);
        root.appendChild(wrapper);
        selectContents(sel, wrapper);
        return;
    }

    const next = blocks
        .filter((b) => SIMPLE_BLOCKS.has(b.tagName))
        .map((b) => replaceTag(b, tag));

    if (next.length) {
        const r = document.createRange();
        r.setStartBefore(next[0]);
        r.setEndAfter(next[next.length - 1]);
        sel.removeAllRanges();
        sel.addRange(r);
    }
};

export const toggleList = (root: HTMLElement, ordered: boolean): void => {
    const listTag = ordered ? 'OL' : 'UL';
    const ctx = getCtx(root);
    if (!ctx) return;
    const { sel, range } = ctx;

    const blocks = selectedTopBlocks(root, range);
    if (!blocks.length) return;

    if (blocks.every((b) => b.tagName === listTag)) {
        blocks.forEach((list) => {
            const frag = document.createDocumentFragment();
            Array.from(list.children).forEach((li) => {
                const p = document.createElement('p');
                while (li.firstChild) p.appendChild(li.firstChild);
                frag.appendChild(p);
            });
            list.replaceWith(frag);
        });
        return;
    }

    const list = document.createElement(listTag);
    root.insertBefore(list, blocks[0]);
    blocks.forEach((b) => {
        const li = document.createElement('li');
        while (b.firstChild) li.appendChild(b.firstChild);
        list.appendChild(li);
        b.remove();
    });
    selectContents(sel, list);
};

export const wrapLink = (root: HTMLElement, href: string): boolean => {
    const ctx = getCtx(root);
    if (!ctx || ctx.range.collapsed) return false;
    const { sel, range } = ctx;
    const a = document.createElement('a');
    a.setAttribute('href', href);
    try {
        range.surroundContents(a);
    } catch {
        a.appendChild(range.extractContents());
        range.insertNode(a);
    }
    selectContents(sel, a);
    return true;
};

const insertNodeAtCaret = (
    root: HTMLElement,
    node: Node,
    lastRef: Node | null,
): void => {
    const ctx = getCtx(root);
    if (!ctx) {
        root.appendChild(node);
        return;
    }
    const { sel, range } = ctx;
    range.deleteContents();
    range.insertNode(node);
    if (lastRef) {
        range.setStartAfter(lastRef);
        range.collapse(true);
        sel.removeAllRanges();
        sel.addRange(range);
    }
};

export const insertImage = (root: HTMLElement, src: string): void => {
    const img = document.createElement('img');
    img.setAttribute('src', src);
    insertNodeAtCaret(root, img, img);
};

export const insertHtml = (root: HTMLElement, html: string): void => {
    const tpl = document.createElement('template');
    tpl.innerHTML = html;
    const frag = tpl.content;
    const last = frag.lastChild;
    insertNodeAtCaret(root, frag, last);
};

export const serializeEditor = (root: HTMLElement): string => {
    const clone = root.cloneNode(true);
    if (!(clone instanceof HTMLElement)) return root.innerHTML;
    clone.querySelectorAll('div').forEach((d) => {
        const p = document.createElement('p');
        while (d.firstChild) p.appendChild(d.firstChild);
        d.replaceWith(p);
    });
    return clone.innerHTML;
};
