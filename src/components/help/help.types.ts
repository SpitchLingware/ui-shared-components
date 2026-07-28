export type HelpMode = 'read' | 'edit';
export type HelpLocale = string;
export type HelpNodeType = 'section' | 'article' | 'link';

export interface HelpNode {
    id: string;
    parentId: string | null;
    order: number;
    type: HelpNodeType;
    slug: string;
    title: string;
    children: HelpNode[];
    contextKey?: string;
    externalUrl?: string;
    icon?: string;
    body?: string;
}
