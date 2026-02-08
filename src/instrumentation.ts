/**
 * Next.js instrumentation - runs once at server startup before any route handlers.
 *
 * Sets NODE_TLS_REJECT_UNAUTHORIZED=0 to allow connections to workspace-proxy
 * which uses self-signed certificates. This must be set at the process level
 * before any TLS connections are made.
 *
 * Note: nexar.yaml env vars are NOT injected into the Cloud Run container,
 * and setting process.env in library modules doesn't propagate to Turbopack
 * worker contexts. This instrumentation hook is the reliable way.
 */
export async function register() {
  if (process.env.WORKSPACE_PROXY_URL?.includes('.internal')) {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
    console.log('[instrumentation] TLS verification disabled for internal workspace-proxy')
  }
}
