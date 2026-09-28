# mitmproxy addon for tools/capture/capture.sh: records a CLI agent's HTTPS traffic for Trace.
#
# Credentials never reach the saved HAR, but the fact that one was sent does. Each flow is scrubbed only
# after it has gone upstream (so the real request still authenticates) and before mitmproxy's HAR writer
# runs at shutdown. A credential is replaced, where it was, by a description:
#
#   Bearer <redacted by trace-capture: JWT | 1180 chars | fp 3fa2c1d0 | alg RS256 | claims aud,exp,iat,iss,scp
#          | issuer https://auth.example.com | lifetime 10d>
#
# kind (from the value's shape), length, a fingerprint that is the same for the same value within one
# capture only (an HMAC under a key made for this run and never saved), and for a JWT its algorithm, claim
# names, issuer, audience, scopes and lifetime, never claim values that could identify you. Parts are
# separated by " | ", which a Cookie or Set-Cookie parser leaves alone (";" would split them). Cookies keep
# their names and Set-Cookie attributes. Covered: auth, cookie and API-key headers; bearer tokens, JWTs,
# API keys and token fields in bodies and websocket frames; token-like URL query parameters. Redaction is
# idempotent: a description is never described again.
#
# Server-sent event streams are passed through as they arrive (an interactive session still streams)
# and teed into the flow, so the HAR keeps the whole stream.
import base64
import hashlib
import hmac
import json
import re
import secrets

from mitmproxy import http

PREFIX = "<redacted by trace-capture"
RUN_KEY = secrets.token_bytes(32)
SECRET_HEADER = re.compile(
    r"^(authorization|proxy-authorization|cookie|set-cookie|x-api-key|anthropic-api-key|api-key"
    r"|chatgpt-account-id|openai-organization|openai-project|x-csrf-token|openai-sentinel-.*|x-oai-.*token.*"
    r"|dd-api-key|dd-application-key|dd-client-token)$",
    re.I,
)
HEADER_KIND = {
    "chatgpt-account-id": "ChatGPT account id",
    "openai-organization": "OpenAI organization id",
    "openai-project": "OpenAI project id",
    "x-csrf-token": "CSRF token",
    "dd-api-key": "Datadog client key",
    "dd-application-key": "Datadog application key",
    "dd-client-token": "Datadog client token",
}
TOKEN_FIELD = re.compile(
    r'("(?:access_token|refresh_token|id_token|api_key|apiKey|session_token|sentinel_token|proof_token'
    r'|turnstile_token|accessToken|refreshToken|idToken)"\s*:\s*")(?!<redacted)([^"]+)"'
)
BEARER = re.compile(r"\b(Bearer\s+)(?!<redacted)([A-Za-z0-9._~+/=-]{12,})")
API_KEY = re.compile(r"\b(?:sk-(?:ant-|proj-)?[A-Za-z0-9_-]{16,}|npm_[A-Za-z0-9]{20,}|gh[pousr]_[A-Za-z0-9]{20,})")
JWT = re.compile(r"\beyJ[A-Za-z0-9_-]{8,}\.eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}")
SECRET_QUERY = re.compile(
    r"^(access_token|token|id_token|refresh_token|api_key|apikey|auth|authorization|client_secret|password"
    r"|code|code_verifier|session_token|sig|signature)$",
    re.I,
)
TEE = "trace_capture_tee"


def fingerprint(value):
    return hmac.new(RUN_KEY, value.encode("utf-8", "replace"), hashlib.sha256).hexdigest()[:8]


def token_kind(token):
    if token.startswith("sk-ant-oat"):
        return "Anthropic OAuth access token"
    if token.startswith("sk-ant-ort"):
        return "Anthropic OAuth refresh token"
    if token.startswith("sk-ant-api"):
        return "Anthropic API key"
    if token.startswith("sk-ant-"):
        return "Anthropic key"
    if token.startswith("sk-"):
        return "OpenAI API key"
    if token.startswith("npm_"):
        return "npm token"
    if re.match(r"gh[pousr]_", token):
        return "GitHub token"
    if JWT.fullmatch(token):
        return "JWT"
    return "opaque token"


def _b64json(segment):
    try:
        return json.loads(base64.urlsafe_b64decode(segment + "=" * (-len(segment) % 4)))
    except Exception:
        return None


def _plain(value):
    # Only values that cannot identify anyone: no addresses, bounded, no separators of our own.
    return isinstance(value, str) and "@" not in value and len(value) <= 120 and not re.search(r"[;|<>\"\\]", value)


def jwt_facts(token):
    head, body, _ = token.split(".", 2)
    header, claims = _b64json(head) or {}, _b64json(body)
    if not isinstance(claims, dict):
        return ["undecodable claims"]
    facts = []
    if _plain(header.get("alg")):
        facts.append(f"alg {header['alg']}")
    names = []
    for name, value in sorted(claims.items()):
        names.append(f"{name}{{{','.join(sorted(value))}}}" if isinstance(value, dict) else name)
    facts.append("claims " + ",".join(n for n in names if _plain(n)))
    if _plain(claims.get("iss")):
        facts.append(f"issuer {claims['iss']}")
    aud = claims.get("aud")
    auds = [a for a in (aud if isinstance(aud, list) else [aud]) if _plain(a)]
    if auds:
        facts.append("audience " + ",".join(auds))
    scope = claims.get("scp", claims.get("scope"))
    scopes = scope if isinstance(scope, list) else str(scope).split() if scope else []
    if scopes and all(_plain(s) for s in scopes):
        facts.append("scopes " + ",".join(scopes))
    if isinstance(claims.get("exp"), (int, float)) and isinstance(claims.get("iat"), (int, float)):
        facts.append("lifetime " + _duration(claims["exp"] - claims["iat"]))
    return facts


def _duration(seconds):
    for unit, size in (("d", 86400), ("h", 3600), ("m", 60)):
        if seconds >= size:
            return f"{seconds / size:.3g}{unit}"
    return f"{int(seconds)}s"


def describe(value, kind=None):
    token = value.strip()
    parts = [kind or token_kind(token), f"{len(token)} chars", f"fp {fingerprint(token)}"]
    if parts[0] == "JWT":
        parts += jwt_facts(token)
    return f"{PREFIX}: {' | '.join(parts)}>"


def scrub_text(text):
    text = TOKEN_FIELD.sub(lambda m: m.group(1) + describe(m.group(2)) + '"', text)
    text = BEARER.sub(lambda m: m.group(1) + describe(m.group(2)), text)
    text = JWT.sub(lambda m: describe(m.group(0)), text)
    return API_KEY.sub(lambda m: describe(m.group(0)), text)


def _cookie_pairs(value):
    out = []
    for pair in value.split(";"):
        name, eq, val = pair.strip().partition("=")
        if not name:
            continue
        out.append(f"{name}={describe(val, 'cookie value')}" if eq and not val.startswith(PREFIX) else pair.strip())
    return "; ".join(out)


def _set_cookie(value):
    first, _, attributes = value.partition(";")
    name, eq, val = first.strip().partition("=")
    if not eq or val.startswith(PREFIX):
        return value
    return f"{name}={describe(val, 'cookie value')}" + (f";{attributes}" if attributes else "")


def scrub_header(name, value):
    lower = name.lower()
    if PREFIX in value:
        return value
    if lower == "cookie":
        return _cookie_pairs(value)
    if lower == "set-cookie":
        return _set_cookie(value)
    scheme, _, rest = value.partition(" ")
    if lower in ("authorization", "proxy-authorization") and rest and scheme.lower() in ("bearer", "basic", "token"):
        return f"{scheme} {describe(rest)}"
    return describe(value, HEADER_KIND.get(lower))


def scrub_headers(headers):
    for name in list(headers.keys()):
        if SECRET_HEADER.match(name):
            values = headers.get_all(name)
            clean = [scrub_header(name, v) for v in values]
            if clean != values:
                headers.set_all(name, clean)


def scrub_query(request):
    for name in list(request.query.keys()):
        values = request.query.get_all(name)
        clean = [
            v if v.startswith(PREFIX) else describe(v) if SECRET_QUERY.match(name) or token_kind(v) != "opaque token" else v
            for v in values
        ]
        if clean != values:
            request.query.set_all(name, clean)


def scrub_message(message):
    if message is None:
        return
    scrub_headers(message.headers)
    if not message.raw_content:
        return
    try:
        text = message.get_text(strict=False)
    except Exception:
        return
    if text:
        clean = scrub_text(text)
        if clean != text:
            message.text = clean


def scrub_flow(flow):
    scrub_query(flow.request)
    scrub_message(flow.request)
    scrub_message(flow.response)


def responseheaders(flow: http.HTTPFlow):
    if "text/event-stream" in flow.response.headers.get("content-type", ""):
        chunks = []

        def tee(data: bytes) -> bytes:
            chunks.append(data)
            return data

        flow.response.stream = tee
        flow.metadata[TEE] = chunks


def response(flow: http.HTTPFlow):
    chunks = flow.metadata.pop(TEE, None)
    if chunks is not None:
        # The stream went through as raw (still content-encoded) bytes; keep them that way.
        flow.response.raw_content = b"".join(chunks)
    scrub_flow(flow)


def error(flow: http.HTTPFlow):
    flow.metadata.pop(TEE, None)
    scrub_flow(flow)


def websocket_end(flow: http.HTTPFlow):
    # Frames are scrubbed only after the socket closes: changing one earlier would change what is sent.
    for message in flow.websocket.messages:
        if message.is_text:
            clean = scrub_text(message.text)
            if clean != message.text:
                message.text = clean
    scrub_flow(flow)
