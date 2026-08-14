import { useEffect, useMemo, useState } from 'react';

export type FilterOption = { id: string; label: string };

export type OptionSource =
    | Array<FilterOption>
    | (() => Promise<Array<FilterOption>>)
    | undefined;

/* a chip and the list it was picked from ask for the same options; without a
   cache every added filter costs a second round trip */
const pending = new WeakMap<object, Promise<Array<FilterOption>>>();

const load = (source: OptionSource): Promise<Array<FilterOption>> => {
    if (!source) return Promise.resolve([]);
    if (Array.isArray(source)) return Promise.resolve(source);

    const cached = pending.get(source);
    if (cached) return cached;

    const request = Promise.resolve()
        .then(source)
        .then((res) => res || [])
        .catch(() => {
            pending.delete(source);
            return [] as Array<FilterOption>;
        });
    pending.set(source, request);
    return request;
};

export const useFilterOptions = (
    source: OptionSource,
): { options: Array<FilterOption>; loading: boolean } => {
    const [options, setOptions] = useState<Array<FilterOption>>(() =>
        Array.isArray(source) ? source : [],
    );
    const [loading, setLoading] = useState(
        Boolean(source) && !Array.isArray(source),
    );

    useEffect(() => {
        if (!source) {
            setOptions([]);
            setLoading(false);
            return;
        }
        if (Array.isArray(source)) {
            setOptions(source);
            setLoading(false);
            return;
        }
        let cancelled = false;
        setLoading(true);
        load(source).then((res) => {
            if (cancelled) return;
            setOptions(res);
            setLoading(false);
        });
        return () => {
            cancelled = true;
        };
    }, [source]);

    return { options, loading };
};

export const useOptionLabel = (
    source: OptionSource,
): ((id: string) => string) => {
    const { options } = useFilterOptions(source);
    return useMemo(() => {
        const byId = new Map(options.map((o) => [o.id, o.label]));
        return (id: string) => byId.get(id) ?? id;
    }, [options]);
};
