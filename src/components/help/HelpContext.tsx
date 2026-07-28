import { createContext, useContext } from 'react';

export interface HelpContextValue {
    openByContextKey: (key: string) => void;
    openBySlug: (slug: string) => void;
    open: () => void;
    close: () => void;
    isOpen: boolean;
    canEdit: boolean;
    hasContext: (key: string) => boolean;
    createForContext: (key: string, title?: string) => void;
}

export const HelpContext = createContext<HelpContextValue | null>(null);
export const useHelp = () => {
    const ctx = useContext(HelpContext);
    if (!ctx) throw new Error('useHelp must be used within HelpProvider');

    return ctx;
};
