# mitmproxy addon for tools/capture/capture.sh: records a CLI agent's HTTPS traffic for Trace.
#
# Credentials never reach the saved HAR. Each flow is scrubbed only after it has gone upstream (so the
# real request still authenticates) and before mitmproxy's HAR writer runs at shutdown: auth, cookie and
# API-key headers, bearer tokens, API keys and token fields in bodies, and websocket frames. Redaction is
# idempotent, so a flow seen by two hooks keeps one placeholder.
#
# Server-sent event streams are passed through as they arrive (an interactive session still streams)
# and teed into the flow, so the HAR keeps the whole stream.
import re

from mitmproxy import http

PLACEHOLDER = "<redacted by trace-capture>"
SECRET_HEADER = re.compile(
    r"^(authorization|proxy-authorization|cookie|set-cookie|x-api-key|anthropic-api-key|api-key"
    r"|chatgpt-account-id|openai-organization|openai-project|x-csrf-token|openai-sentinel-.*|x-oai-.*token.*)$",
    re.I,
)
TOKEN_FIELD = re.compile(
    r'("(?:access_token|refresh_token|id_token|api_key|apiKey|session_token|sentinel_token|proof_token'
    r'|turnstile_token|accessToken|refreshToken|idToken)"\s*:\s*")(?!<redacted)[^"]+"'
)
BEARER = re.compile(r"\b(Bearer\s+)(?!<redacted)[A-Za-z0-9._~+/=-]{12,}")
API_KEY = re.compile(r"\bsk-(?:ant-|proj-)?[A-Za-z0-9_-]{16,}")
JWT = re.compile(r"\beyJ[A-Za-z0-9_-]{8,}\.eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}")
TEE = "trace_capture_tee"


def scrub_text(text):
    text = TOKEN_FIELD.sub(lambda m: m.group(1) + PLACEHOLDER + '"', text)
    text = BEARER.sub(lambda m: m.group(1) + PLACEHOLDER, text)
    text = JWT.sub(PLACEHOLDER, text)
    return API_KEY.sub(PLACEHOLDER, text)


def scrub_headers(headers):
    for name in list(headers.keys()):
        if SECRET_HEADER.match(name) and any(v != PLACEHOLDER for v in headers.get_all(name)):
            headers.set_all(name, [PLACEHOLDER])


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
