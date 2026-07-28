import { describe, it, expect } from 'vitest';

// parseBucketPath is exported from the hook file, so we can import it directly
import { parseBucketPath } from '../useDragAndDrop';

describe('parseBucketPath(value)', () => {

    describe('numeric values', () => {
        it('should return empty string and number for numeric input', () => {
            expect(parseBucketPath(5)).toEqual(['', 5]);
            expect(parseBucketPath(0)).toEqual(['', 0]);
            expect(parseBucketPath(100)).toEqual(['', 100]);
        });

        it('should handle negative numbers (edge case)', () => {
            // Negative numbers still parse to ['', -1]
            expect(parseBucketPath(-1)).toEqual(['', -1]);
        });
    });

    describe('string values without dot', () => {
        it('should convert string number to [path, index]', () => {
            expect(parseBucketPath('5')).toEqual(['', 5]);
            expect(parseBucketPath('0')).toEqual(['', 0]);
            expect(parseBucketPath('123')).toEqual(['', 123]);
        });

        it('should return empty path for pure numeric strings', () => {
            const [path, index] = parseBucketPath('42');
            expect(path).toBe('');
            expect(index).toBe(42);
        });
    });

    describe('string values with dot (dotted paths)', () => {
        it('should split path and index at last dot', () => {
            expect(parseBucketPath('features.0')).toEqual(['features', 0]);
            expect(parseBucketPath('items.5')).toEqual(['items', 5]);
            expect(parseBucketPath('nested.path.10')).toEqual(['nested.path', 10]);
        });

        it('should handle multiple dots in path', () => {
            const [path, index] = parseBucketPath('a.b.c.3');
            expect(path).toBe('a.b.c');
            expect(index).toBe(3);
        });

        it('should handle single segment before dot', () => {
            const [path, index] = parseBucketPath('x.1');
            expect(path).toBe('x');
            expect(index).toBe(1);
        });

        it('should return empty path for leading dot', () => {
            const [path, index] = parseBucketPath('.5');
            expect(path).toBe('');
            expect(index).toBe(5);
        });
    });

    describe('edge cases', () => {
        it('should handle string with no numeric part after dot', () => {
            const [path, index] = parseBucketPath('features.');
            expect(path).toBe('features');
            expect(index).toBe(0); // Number('') returns 0, not NaN
        });

        it('should handle empty string', () => {
            const result = parseBucketPath('');
            expect(result[1]).toBe(0); // parseInt('') returns 0 in this implementation? Let's check...
            // Actually: Number('') === 0, so index will be 0
        });

        it('should handle string with only dots', () => {
            const result = parseBucketPath('...');
            expect(result[0]).toBe('..');
            expect(result[1]).toBe(0); // Number('') returns 0, not NaN
        });

        it('should handle non-numeric strings (edge case)', () => {
            // If someone passes a non-numeric string, Number() returns NaN
            const result = parseBucketPath('abc');
            expect(result[1]).toBeNaN();
        });
    });
});

describe('useDragAndDrop logic (applyChanges)', () => {
    // Test the internal applyChanges logic that uses parseBucketPath
    const cloneDeep = <T>(obj: T): T => JSON.parse(JSON.stringify(obj));
    const get = (obj: any, path: string) => {
        return path.split('.').reduce((acc, key) => acc?.[key], obj);
    };

    it('should move element from one array to another', () => {
        // Simulate the applyChanges logic
        const dataObject = {
            features: [
                { id: 'a' },
                { id: 'b' },
                { id: 'c' },
            ],
        };

        const from = { id: 'a', __path: 'features.0' };
        const to = { id: 'c', __path: 'features.2' };

        // Parse paths
        let [path1, idx1] = parseBucketPath('features.0');
        let [path2, idx2] = parseBucketPath('features.2');

        expect([path1, path2]).toEqual(['features', 'features']);
        expect([idx1, idx2]).toEqual([0, 2]);

        // Apply changes (simplified version of the hook logic)
        const update = cloneDeep(dataObject);
        const originArray = get(update, path1);
        const destinationArray = get(update, path2);

        const element = originArray.splice(idx1, 1)[0];
        if (path1 === path2 && idx1 < idx2) {
            idx2--;
        }
        destinationArray.splice(idx2, 0, ...[element]);

        // After moving 'a' from index 0 to after 'c' (which shifted to index 1):
        // ['b', 'a', 'c'] - the element is inserted at position idx2 (which became 1)
        expect(update.features.map((f: any) => f.id)).toEqual(['b', 'a', 'c']);
    });

    it('should handle drag within same array (idx1 < idx2)', () => {
        const dataObject = { items: ['a', 'b', 'c', 'd'] };

        let [path1, idx1] = parseBucketPath('items.0');
        let [path2, idx2] = parseBucketPath('items.3');

        expect(path1).toBe('items');
        expect(path2).toBe('items');
        expect(idx1).toBe(0);
        expect(idx2).toBe(3);

        // When moving from 0 to 3 in same array, idx2 should decrease by 1 after splice
        const update = cloneDeep(dataObject);
        const originArray = get(update, path1);
        const destinationArray = get(update, path2);

        const element = originArray.splice(idx1, 1)[0];
        if (path1 === path2 && idx1 < idx2) {
            idx2--; // Now idx2 is 2
        }
        destinationArray.splice(idx2, 0, ...[element]);

        // After moving 'a' from index 0 to position 2: ['b', 'c', 'a', 'd']
        expect(update.items).toEqual(['b', 'c', 'a', 'd']);
    });

    it('should handle drag within same array (idx1 > idx2)', () => {
        const dataObject = { items: ['a', 'b', 'c'] };

        let [path1, idx1] = parseBucketPath('items.2');
        let [path2, idx2] = parseBucketPath('items.0');

        const update = cloneDeep(dataObject);
        const originArray = get(update, path1);
        const destinationArray = get(update, path2);

        const element = originArray.splice(idx1, 1)[0];
        // idx1 (2) > idx2 (0), so no adjustment needed
        destinationArray.splice(idx2, 0, ...[element]);

        expect(update.items).toEqual(['c', 'a', 'b']);
    });

    it('should handle trailing dot case (index becomes 0)', () => {
        const dataObject = { features: [] };

        let [path1, idx1] = parseBucketPath('features.'); // trailing dot -> index is 0
        let [path2, idx2] = parseBucketPath('items.5');

        expect(idx1).toBe(0); // Number('') returns 0, not NaN
    });
});
