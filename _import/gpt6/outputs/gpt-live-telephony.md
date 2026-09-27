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

The guide also covers transfer, hangup, and outbound calls. Outbound SIP requires organization enablement. Existing integrations may still receive the deprecated `live.call.incoming` event during migration. See the [full guide](https://developers.openai.com/api/docs/guides/voice-sip) for the current event and request contracts.

## Evidence boundary

This is a **GPT-Live API capability documented by OpenAI**, not a `config.toml` setting. The bundled Codex CLI `0.158.0-alpha.2` binary contains `gpt-live-1-codex` and `/v1/live`; its `realtime.transport` parser accepts `webrtc` and `websocket` and rejects `sip`. See the [Codex Realtime config entries](/codex-config/#realtime).
