// Identifies one frontend build, so an open tab can tell that a newer build has
// been deployed (see src/utils/appVersion.js). Used only by vite.config.js at
// build time; contains no secrets - just the commit, branch and build time that
// Render already exposes to every build (RENDER_GIT_COMMIT / RENDER_GIT_BRANCH).
//
// buildId changes on EVERY build, not only on a new commit: a rebuild of the
// same commit with changed VITE_* settings produces a different bundle too.
export function makeBuildInfo(env = {}, now = new Date()) {

    const clean = (value, max) => (typeof value === "string" ? value.trim().replace(/[^A-Za-z0-9._/-]/g, "").slice(0, max) : "");

    const commit = clean(env.RENDER_GIT_COMMIT || env.GIT_COMMIT, 40);
    const branch = clean(env.RENDER_GIT_BRANCH || env.GIT_BRANCH, 100);
    const builtAt = now.toISOString();

    return {
        buildId: `${commit ? commit.slice(0, 12) : "local"}-${now.getTime().toString(36)}`,
        commit: commit || null,
        branch: branch || null,
        builtAt,
    };
}
