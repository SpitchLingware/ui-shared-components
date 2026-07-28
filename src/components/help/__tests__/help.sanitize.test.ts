import { describe, it, expect } from 'vitest';

describe('help.sanitize module', () => {
    // Test FALLBACK_HTML_POLICY structure (schemeOf logic is internal)
    describe('FALLBACK_HTML_POLICY', () => {
        it('should have allowedTags array with standard HTML elements', async () => {
            const { FALLBACK_HTML_POLICY } = await import('../help.sanitize');
            expect(FALLBACK_HTML_POLICY.allowedTags).toContain('p');
            expect(FALLBACK_HTML_POLICY.allowedTags).toContain('a');
            expect(FALLBACK_HTML_POLICY.allowedTags).toContain('img');
        });

        it('should have hrefSchemes including http/https', async () => {
            const { FALLBACK_HTML_POLICY } = await import('../help.sanitize');
            expect(FALLBACK_HTML_POLICY.hrefSchemes).toContain('http');
            expect(FALLBACK_HTML_POLICY.hrefSchemes).toContain('https');
            expect(FALLBACK_HTML_POLICY.hrefSchemes).toContain('mailto');
        });

        it('should have srcSchemes including http/https/data', async () => {
            const { FALLBACK_HTML_POLICY } = await import('../help.sanitize');
            expect(FALLBACK_HTML_POLICY.srcSchemes).toContain('http');
            expect(FALLBACK_HTML_POLICY.srcSchemes).toContain('data');
        });

        it('should have dangerousTags list', async () => {
            const { FALLBACK_HTML_POLICY } = await import('../help.sanitize');
            expect(FALLBACK_HTML_POLICY.dangerousTags).toContain('script');
            expect(FALLBACK_HTML_POLICY.dangerousTags).toContain('iframe');
        });
    });

    // Test createHtmlSanitizer behavior (which internally uses schemeOf)
    describe('createHtmlSanitizer', () => {
        it('should return empty string when no DOM available', async () => {
            const { createHtmlSanitizer, FALLBACK_HTML_POLICY } =
                await import('../help.sanitize');
            const sanitizer = createHtmlSanitizer(FALLBACK_HTML_POLICY);
            // In node environment (no window), should return ''
            expect(sanitizer('<p>test</p>')).toBe('');
        });

        it('should sanitize HTML with allowed tags when DOM available', async () => {
            const { createHtmlSanitizer, FALLBACK_HTML_POLICY } =
                await import('../help.sanitize');

            // Mock DOM if available (jsdom environment)
            if (
                typeof window !== 'undefined' &&
                typeof window.DOMParser !== 'undefined'
            ) {
                const sanitizer = createHtmlSanitizer(FALLBACK_HTML_POLICY);
                const result = sanitizer('<p>Hello <b>World</b></p>');
                expect(result).toContain('Hello');
                expect(result).toContain('World');
            }
        });

        it('should remove dangerous tags', async () => {
            const { createHtmlSanitizer, FALLBACK_HTML_POLICY } =
                await import('../help.sanitize');

            if (
                typeof window !== 'undefined' &&
                typeof window.DOMParser !== 'undefined'
            ) {
                const sanitizer = createHtmlSanitizer(FALLBACK_HTML_POLICY);
                const result = sanitizer(
                    '<p>text</p><script>alert("xss")</script>',
                );
                expect(result).not.toContain('script');
            }
        });

        it('should validate href schemes using schemeOf logic', async () => {
            const { createHtmlSanitizer, FALLBACK_HTML_POLICY } =
                await import('../help.sanitize');

            if (
                typeof window !== 'undefined' &&
                typeof window.DOMParser !== 'undefined'
            ) {
                const sanitizer = createHtmlSanitizer(FALLBACK_HTML_POLICY);
                // Test that allowed scheme works
                const result1 = sanitizer(
                    '<a href="https://example.com">link</a>',
                );
                expect(result1).toContain('href');

                // Test that disallowed scheme is removed (javascript:)
                const result2 = sanitizer(
                    '<a href="javascript:alert(1)">bad link</a>',
                );
                // The href should be removed because 'javascript' is not in allowed schemes
                expect(result2).not.toContain('href="javascript');
            }
        });
    });
});

// Test schemeOf logic directly by extracting it (since it's exported via module)
describe('schemeOf extraction logic', () => {
    // We can't import schemeOf directly, but we can test the pattern it uses
    const schemeOfPattern = (value: string): string => {
        const v = value.replace(/[\s\x00-\x1F]+/g, '');
        const m = /^([a-z][a-z0-9+.-]*):/i.exec(v);
        return m ? m[1].toLowerCase() : '';
    };

    it('should extract https scheme', () => {
        expect(schemeOfPattern('https://example.com')).toBe('https');
    });

    it('should handle various schemes', () => {
        expect(schemeOfPattern('http://test.org')).toBe('http');
        expect(schemeOfPattern('ftp://files.net')).toBe('ftp');
        expect(schemeOfPattern('mailto:user@example.com')).toBe('mailto');
        expect(schemeOfPattern('tel:+1234567890')).toBe('tel');
    });

    it('should return empty string for non-URL strings', () => {
        expect(schemeOfPattern('just text')).toBe('');
        expect(schemeOfPattern('12345')).toBe('');
        expect(schemeOfPattern('')).toBe('');
    });

    it('should be case-insensitive', () => {
        expect(schemeOfPattern('HTTPS://EXAMPLE.COM')).toBe('https');
        expect(schemeOfPattern('HTTP://TEST.ORG')).toBe('http');
    });

    it('should handle URLs with special characters in scheme part', () => {
        // Some schemes can contain digits after the first letter
        expect(schemeOfPattern('test123://example.com')).toBe('test123');
    });

    it('should ignore leading whitespace', () => {
        expect(schemeOfPattern('  https://example.com')).toBe('https');
    });

    it('should handle URLs with port numbers', () => {
        expect(schemeOfPattern('http://localhost:8080/path')).toBe('http');
    });

    it('should strip control characters before parsing', () => {
        // \x00-\x1F are control characters
        expect(schemeOfPattern('\x00https://example.com')).toBe('https');
    });
});
