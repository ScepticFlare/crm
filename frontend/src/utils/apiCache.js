// Tiny in-memory, per-tab cache for reference/master data (products,
// industries, lead sources, batteries, activity types, employees) that
// almost every Leads/Opportunities/Customers/AddLead/EditLead page fetches
// on mount independently - without this, navigating between those pages
// re-requests the same rarely-changing lists over and over in one session.
// Deliberately not Redux/Zustand/React Query - just a module-level Map of
// in-flight/resolved promises, keyed by resource name, invalidated by the
// corresponding service's own create/update/(de)activate calls.
const cache = new Map();

// fetcher: () => Promise<data>. Concurrent callers during the same
// in-flight request share the same promise instead of firing duplicate
// requests (e.g. two components mounting in the same tick).
export function cachedFetch(key, fetcher) {

    if (!cache.has(key)) {
        const promise = fetcher().catch((err) => {
            cache.delete(key);
            throw err;
        });
        cache.set(key, promise);
    }

    return cache.get(key);
}

export function invalidateCache(key) {
    cache.delete(key);
}

// Called on login/logout (see components/TopNavbar.jsx / services/
// authService.js) - this is an SPA navigation, not a full page reload, so
// the module-level cache above would otherwise survive a user switch
// within the same tab and leak one user's RBAC-scoped data (e.g. a
// Manager's employee list) to whoever logs in next.
export function clearAllCache() {
    cache.clear();
}
