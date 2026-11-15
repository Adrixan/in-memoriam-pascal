/**
 * Every literal translation key used in src/ must exist in both locales,
 * and both locales must offer the same keys. A missing key renders its
 * inline default (or the bare key) in every language.
 */

import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const root = path.resolve(import.meta.dirname, '../..');
const srcDir = path.join(root, 'src');
const languages = ['de', 'en'] as const;
const namespaces = ['common', 'tutorials', 'levels', 'errors'] as const;
type Namespace = (typeof namespaces)[number];
type Tree = { [key: string]: Tree | string };

const pluralSuffixes = ['_zero', '_one', '_two', '_few', '_many', '_other'];

function loadLocale(language: string, namespace: string): Tree {
    const file = path.join(srcDir, 'i18n', 'locales', language, `${namespace}.json`);
    return JSON.parse(readFileSync(file, 'utf8')) as Tree;
}

function leafKeys(tree: Tree, prefix = ''): string[] {
    return Object.entries(tree).flatMap(([key, value]) => {
        const full = prefix ? `${prefix}.${key}` : key;
        return typeof value === 'string' ? [full] : leafKeys(value, full);
    });
}

function hasKey(tree: Tree, key: string): boolean {
    const parts = key.split('.');
    const last = parts.pop() ?? '';
    let node: Tree | string | undefined = tree;
    for (const part of parts) {
        if (typeof node !== 'object') return false;
        node = node[part];
    }
    if (typeof node !== 'object') return false;
    const parent = node;
    return typeof parent[last] === 'string'
        || pluralSuffixes.some((suffix) => typeof parent[`${last}${suffix}`] === 'string');
}

function sourceFiles(dir: string): string[] {
    return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) return sourceFiles(full);
        return /\.tsx?$/.test(entry.name) && !/\.(test|spec)\.tsx?$/.test(entry.name) ? [full] : [];
    });
}

function isNamespace(value: string): value is Namespace {
    return (namespaces as readonly string[]).includes(value);
}

/** Literal keys only: t('a.b') or t("a.b"); template literals are skipped. */
const callPattern = /\bt\(\s*(['"])([\w.:-]+)\1/g;
const namespacePattern = /useTranslation\(\s*\[?\s*['"](\w+)['"]/;

const locales = Object.fromEntries(
    languages.map((language) => [
        language,
        Object.fromEntries(namespaces.map((ns) => [ns, loadLocale(language, ns)])) as Record<Namespace, Tree>,
    ]),
) as Record<(typeof languages)[number], Record<Namespace, Tree>>;

describe('i18n keys', () => {
    it('both locales define every literal key used in src', () => {
        const missing: string[] = [];
        for (const file of sourceFiles(srcDir)) {
            const source = readFileSync(file, 'utf8');
            const fileNamespace = namespacePattern.exec(source)?.[1] ?? 'common';
            for (const match of source.matchAll(callPattern)) {
                const raw = match[2] ?? '';
                const [ns, key] = raw.includes(':') ? raw.split(':', 2) as [string, string] : [fileNamespace, raw];
                if (!isNamespace(ns)) continue;
                for (const language of languages) {
                    if (!hasKey(locales[language][ns], key)) {
                        missing.push(`${language} ${ns}:${key} (${path.relative(root, file)})`);
                    }
                }
            }
        }
        expect(missing).toEqual([]);
    });

    it.each(namespaces)('de and en offer the same keys in %s', (ns) => {
        expect(leafKeys(locales.de[ns]).sort()).toEqual(leafKeys(locales.en[ns]).sort());
    });
});
