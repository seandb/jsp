function unauthorized() {
  return new Response("Authentication required", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Protected"' }
  });
}

function parseBasicAuth(request) {
  const h = request.headers.get("Authorization") || "";
  const [scheme, encoded] = h.split(" ");
  if (scheme !== "Basic" || !encoded) return null;
  const decoded = atob(encoded);
  const i = decoded.indexOf(":");
  if (i < 0) return null;
  return { user: decoded.slice(0, i), pass: decoded.slice(i + 1) };
}

export default {
  async fetch(request, env) {
    const creds = parseBasicAuth(request);
    if (!creds) return unauthorized();
    if (creds.user !== env.BASIC_USER || creds.pass !== env.BASIC_PASS) return unauthorized();

    // Serve your static exported site from the repo root
    return env.ASSETS.fetch(request);
  }
};