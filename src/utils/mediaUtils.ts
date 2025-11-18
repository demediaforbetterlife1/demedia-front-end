const BACKEND_BASE_URL = "https://demedia-backend.fly.dev";

const needsPrefix = (url: string) => {
    return url && !url.startsWith("http") && !url.startsWith("data:");
};

export function ensureAbsoluteMediaUrl(url?: string | null): string | null {
    if (!url) return null;
    if (!needsPrefix(url)) return url;
    const normalized = url.startsWith("/") ? url : `/${url}`;
    return `${BACKEND_BASE_URL}${normalized}`;
}

export function appendCacheBuster(url: string): string {
    if (!url) return url;
    const separator = url.includes("?") ? "&" : "?";
    return `${url}${separator}t=${Date.now()}`;
}

