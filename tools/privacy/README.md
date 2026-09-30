# Private real-session review candidates

`sanitize-session.mjs` reads an explicit family of real JSONL files and JSON metadata
sidecars, scrubs values, and writes gzip files plus a **private** audit. It preserves
row order/types, timestamps and numeric usage. HMAC aliases are consistent across
records, paths and metadata; UUID7 aliases retain their original timestamp bits.
Subagent directories and `.meta.json` sidecars retain their topology. The source
hashes, original ID map and alias salt stay in the private audit and must never be
copied into the public manifest.

CLI preparation writes only beneath `private/`:

```sh
node tools/privacy/sanitize-session.mjs private/review-candidate /selected/root.jsonl /selected/root/subagents/agent-example.jsonl /selected/root/subagents/agent-example.meta.json
node tools/privacy/review-session.mjs private/review-candidate/private-audit.json private/review-candidate/semantic-candidates.json
```

The second command verifies every compressed file against the audit and prepares
locally deduplicated, bounded text; it makes **zero network calls**. Use the exported
`reviewSanitizedCandidates` with explicitly locally approved candidate hashes to
request Jev/Decisions review. The complete selection is boundary-checked before
any request; secret/private literals and original IDs can be supplied to the check.
Credentials are read through the existing Jev provider and are never printed.
Questions are batched, answers must match every exact text hash, and probabilities
must be finite numbers within `[0,1]`. Review output never grants publication
approval. Store semantic candidates, approvals and results privately with mode 0600.

Before promotion, independently inspect the scrubbed content, compare adapter
counts/joins/timing/usage with the original family, scan decompressed assets through
the leak gate, and check the public manifest contains no source paths or original
IDs. Supply additional known third-party names/values through `privateNames` and
`privateValues`; pattern matches alone cannot discover every private fact in prose.
Sensitive prose and opaque encoded media are withheld rather than substituted with
invented activity. Exact original character sizes and media contents are therefore
not preserved; explicitly recorded usage numbers and real activity rows are.

The API accepts `.jsonl`, one-line JSON metadata, plain-text tool-result files and
existing gzip inputs. Select only files belonging to the approved family. It does
not recursively collect other sessions. Output files are individually gzip encoded;
`files[].name`, `bytes`, `uncompressedBytes`, and `sha256` supply a public manifest's
asset fields after approval, while `source` and `sourceSha256` remain private.
