# GPT-Live telephony and SIP

OpenAI's [Telephony and SIP developer guide](https://developers.openai.com/api/docs/guides/voice-sip) documents two ways to connect a phone call to GPT-Live:

| Connection | Audio path | Your application handles |
| --- | --- | --- |
| Direct SIP | The provider exchanges call audio with OpenAI. | Incoming-call webhooks, authorization, session setup, call decisions, and business logic. |
| Server audio bridge | Your application relays provider or room audio to GPT-Live over WebSocket. | Both connections, audio playback, event translation, and the call lifecycle. |

For direct SIP, the guide specifies TLS for SIP signaling and SRTP for call audio. The backend can attach a sideband WebSocket to receive events and send commands while SIP carries audio. SIP support must be enabled for the project and the provider's trunk routed to it.

## Inbound call flow

1. Subscribe to `live.transport.incoming`. Verify the webhook signature and deduplicate deliveries. The event identifies a SIP call with `data.type: "sip"` and supplies `data.session_id`; use that ID for call actions. Treat `data.sip_headers` as untrusted caller metadata.
2. Make one accept or reject decision for the call. The [accept endpoint](https://developers.openai.com/api/reference/resources/live/subresources/sessions/methods/accept) is `POST /v1/live/sessions/{session_id}/accept`; the [reject endpoint](https://developers.openai.com/api/reference/resources/live/subresources/sessions/methods/reject) uses the same session path with `/reject`.
3. After acceptance, attach the backend at `wss://api.openai.com/v1/live/sessions/{session_id}/attach` when it needs transcripts, delegation, tools, or commands. The SIP path continues to carry call audio.

Existing integrations may still receive the deprecated `live.call.incoming` event during migration.

## Transfer and hangup

- **Transfer:** `POST /v1/live/sessions/{session_id}/refer` with `{"target_uri": "sip:agent@example.com"}` (a `sip:` or `tel:` URI). Returns `200 OK` with an empty body.
- **Hang up:** `POST /v1/live/sessions/{session_id}/hangup` with no request body. Returns `200 OK`.

## Outbound calls

`POST /v1/live/sessions` with a SIP transport places a call:

| Field | Value |
| --- | --- |
| `transport.type` | `"sip"` |
| `transport.destination` | the number to call, E.164 (`+14155550123`) |
| `transport.trunk.provider_url` | the provider's SIP endpoint, `sips:` (`sips:sip.example.com:5061`) |
| `transport.trunk.auth.type`, `.username`, `.password` | `"digest"` and the trunk credentials |
| `transport.trunk.caller_number` | the caller ID, E.164 |

Outbound SIP must be enabled for the organization; otherwise the call is refused with `403` `outbound_sip_not_enabled`. Limits: 1 MiB request body, 3 minutes of ringing, 2 hours connected.

## Addresses, keypad and audio

- **SIP addresses:** `sip:$PROJECT_ID@sip.api.openai.com;transport=tls`, or `sip-eu.api.openai.com` for the EU region.
- **Keypad (DTMF):** the sideband carries `transport.dtmf.received` and `transport.dtmf.send`; `event` is one of `0`–`9`, `*`, `#`, `A`–`D`.
- **Late attach:** the sideband replays only the preceding 3 seconds of events, with their original event IDs, so a backend that attaches late can miss earlier call progress.
- **Audio:** SIP negotiates Opus. The WebSocket bridge takes raw G.711 μ-law or A-law at 8 kHz.

## Realtime API call path

The same guide documents a Realtime API path for SIP calls, separate from GPT-Live sessions: webhook event `realtime.call.incoming`, then `POST /v1/realtime/calls/{call_id}/accept`, `/reject`, `/refer` and `/hangup`, with model `gpt-realtime-2.1`.

See the [full guide](https://developers.openai.com/api/docs/guides/voice-sip) for the current event and request contracts. Checked against the guide on September 28, 2026.

## Evidence boundary

This is a **GPT-Live API capability documented by OpenAI**, not a `config.toml` setting. The bundled Codex CLI `0.158.0-alpha.2` binary contains `gpt-live-1-codex` and `/v1/live`; its `realtime.transport` parser accepts `webrtc` and `websocket` and rejects `sip`. See the [Codex Realtime config entries](codex-config/#realtime).
