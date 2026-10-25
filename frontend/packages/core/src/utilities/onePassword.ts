const AUTH_PATHS = new Set(['/login', '/register']);

export function syncOnePasswordBodyAttribute(
  pathname: string,
  doc: Pick<Document, 'body'> | undefined = typeof document === 'undefined' ? undefined : document,
): void {
  if (!doc?.body) return;
  if (AUTH_PATHS.has(pathname)) {
    doc.body.removeAttribute('data-1p-ignore');
  } else {
    doc.body.setAttribute('data-1p-ignore', '');
  }
}
