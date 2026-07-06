export function getP0PlusPreviewPath(token: string) {
  return `/p0-plus/preview/${encodeURIComponent(token)}`;
}

export function getP0PlusContinuePath(token: string) {
  return `/p0-plus/continue/${encodeURIComponent(token)}`;
}

export function getP0PlusContinueLoginPath(token: string) {
  return `/login?callbackUrl=${getP0PlusContinuePath(token)}`;
}
