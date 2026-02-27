/// <reference types="vite/client" />

// Type declarations for vite-plugin-pwa
/// <reference types="vite-plugin-pwa/client" />

// Type declarations for Vite environment
interface ImportMetaEnv {
    readonly VITE_APP_TITLE: string;
    readonly VITE_APP_VERSION: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}

// Type declarations for CSS modules
declare module '*.css' {
    const content: Record<string, string>;
    export default content;
}

// Type declarations for JSON imports
declare module '*.json' {
    const value: unknown;
    export default value;
}

// Type declarations for image imports
declare module '*.svg' {
    const content: string;
    export default content;
}

declare module '*.png' {
    const content: string;
    export default content;
}

declare module '*.jpg' {
    const content: string;
    export default content;
}

declare module '*.webp' {
    const content: string;
    export default content;
}

// Type declarations for font imports
declare module '*.woff' {
    const content: string;
    export default content;
}

declare module '*.woff2' {
    const content: string;
    export default content;
}
