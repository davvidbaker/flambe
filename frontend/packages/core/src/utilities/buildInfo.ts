export const COMMIT_URL_BASE = 'https://github.com/davvidbaker/flambe/commit';

export type BuildInfo = {
  git_sha: string;
  status?: string;
};

export function shortSha(sha: string): string {
  if (!sha || sha === 'unknown') return sha || 'unknown';
  return sha.length > 7 ? sha.slice(0, 7) : sha;
}

export function commitUrl(sha: string): string | null {
  if (!sha || sha === 'unknown') return null;
  return `${COMMIT_URL_BASE}/${sha}`;
}

export function assetSha(): string {
  return typeof FLAMBE_ASSET_SHA === 'string' && FLAMBE_ASSET_SHA ? FLAMBE_ASSET_SHA : 'unknown';
}

let pending: Promise<BuildInfo> | null = null;

export function fetchBuildInfo(): Promise<BuildInfo> {
  if (!pending) {
    pending = fetch(`${SERVER}/api/health`, { credentials: 'include' })
      .then(async response => {
        if (!response.ok) {
          throw new Error(`health ${response.status}`);
        }
        const body = (await response.json()) as Partial<BuildInfo>;
        return { git_sha: typeof body.git_sha === 'string' && body.git_sha ? body.git_sha : 'unknown' };
      })
      .catch(error => {
        pending = null;
        throw error;
      });
  }
  return pending;
}

export function logBuildInfo(info: BuildInfo): void {
  const sha = info.git_sha || 'unknown';
  const short = shortSha(sha);
  const url = commitUrl(sha);
  const baked = assetSha();
  const details = url ?? '(SHA not baked into this build)';

  console.info(
    `%cFlambe%c ${short}`,
    'background:#111;color:#fff;padding:2px 6px;border-radius:3px;font-weight:600',
    'color:#111;font-weight:600',
    details,
  );

  if (baked !== 'unknown' && sha !== 'unknown' && baked !== sha) {
    console.warn(
      `Flambe assets were built from ${shortSha(baked)} but /api/health reports ${short}. Hard-refresh if you expected the newer commit.`,
    );
  }
}

export async function reportDeployedVersion(): Promise<void> {
  try {
    logBuildInfo(await fetchBuildInfo());
  } catch {
    console.info(
      '%cFlambe%c deploy SHA unavailable',
      'background:#111;color:#fff;padding:2px 6px;border-radius:3px;font-weight:600',
      'color:#666',
    );
  }
}
