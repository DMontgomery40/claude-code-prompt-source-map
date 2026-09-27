#!/usr/bin/env python3
"""Render outputs/codex-config.md and outputs/codex-env-vars.md from the JSON references."""
import collections
import json
import re
from pathlib import Path

REPO = Path(__file__).resolve().parents[2]
OUT = REPO / "outputs"
SRC_PREFIX = re.compile(r"^codex-rs@[^:]+:")


def code(s) -> str:
    s = str(s)
    fence = "``" if "`" in s else "`"
    pad = " " if s.startswith("`") or s.endswith("`") else ""
    return f"{fence}{pad}{s}{pad}{fence}"


def src_link(source: str) -> str:
    if source.startswith("http"):
        return f"[docs]({source})"
    if source.startswith("codex-rs@"):
        return code(SRC_PREFIX.sub("", source))
    if source.startswith("codex binary"):
        return "codex binary"
    return code(source)


def desc_line(desc) -> str | None:
    if not desc or not desc.get("text"):
        return None
    return f"> {desc['text']}\n>\n> — {src_link(desc['source'])}"


def by_group(items):
    groups = collections.OrderedDict()
    for it in items:
        groups.setdefault(it["group"], []).append(it)
    return groups


def fmt_values(values) -> str | None:
    if not values:
        return None
    if len(values) > 10 or not any(v.get("description") for v in values):
        return "Values: " + ", ".join(code(v["value"]) for v in values)
    lines = ["Values:"]
    for v in values:
        lines.append(f"- {code(v['value'])}" + (f": {v['description']}" if v.get("description") else ""))
    return "\n".join(lines)


def render_config():
    doc = json.loads((OUT / "codex-config.json").read_text())
    items = doc["items"]
    v = doc["version"]
    cfg = [i for i in items if not i["id"].startswith("config:requirements:")]
    req = [i for i in items if i["id"].startswith("config:requirements:")]
    documented = sum(1 for i in cfg if i["documented"])
    hidden = [i for i in cfg if i["group"].startswith("Hidden")]
    rejected = [i for i in cfg if i["group"].startswith("Documented but not")]
    feats = [i for i in cfg if i["details"].get("feature_id")]
    stages = collections.Counter(i["details"]["stage"] for i in feats)
    out = []
    out.append("# Codex/ChatGPT `config.toml` reference\n")
    out.append(
        f"This reference covers every `config.toml` key accepted by the Codex CLI bundled in the ChatGPT desktop app "
        f"({v['desktop_app']}; `{v['codex_cli']}`, binary sha256 `{v['codex_binary_sha256'][:16]}…`). "
        f"Keys come from the generated `ConfigToml` JSON Schema and config structs in openai/codex at tag "
        f"`{v['source_tag']}` (the exact release tag for this binary), the feature registry, and probes of the shipped "
        f"binary with a throwaway `CODEX_HOME`. It lists {len(cfg)} `config.toml` entries. {documented} appear in the official "
        f"Codex docs, and {len(cfg) - documented} are undocumented. The entries include {len(feats)} feature flags "
        f"({', '.join(f'{n} {s}' for s, n in stages.most_common())}), {len(hidden)} hidden, legacy, or alias keys that the "
        f"generated schema leaves out, and {len(rejected)} keys that the official reference lists but this build rejects. "
        f"The last section lists {len(req)} `requirements.toml` "
        f"keys for admin-managed policy. Labels: **documented** means the key is in the official config reference or "
        f"another Codex docs page; **undocumented** means it is only in source and the binary; **hidden** means the "
        f"schema generator skips it, but the deserializer still recognizes it (sometimes only to raise a targeted error). Descriptions quote the docs where they exist, "
        f"and the Rust doc comment otherwise. Defaults are shown only where a source states them.\n"
    )
    out.append("Placeholders: `<id>`, `<name>`, `<key>` and similar stand for any table key you choose; `[]` marks an array "
               "of tables. Profiles (`profiles.<name>`) accept a subset of the top-level keys, listed under that entry "
               "rather than repeated.\n")
    groups = by_group(cfg)
    out.append("## Contents\n")
    for g, its in groups.items():
        anchor = re.sub(r"[^a-z0-9 -]", "", g.lower()).replace(" ", "-")
        out.append(f"- [{g}](#{anchor}) ({len(its)})")
    out.append(f"- [Managed requirements (requirements.toml)](#managed-requirements-requirementstoml) ({len(req)})\n")
    for g, its in list(groups.items()) + [("Managed requirements (requirements.toml)", req)]:
        out.append(f"## {g}\n")
        if g == "Realtime voice and audio":
            out.append("GPT-Live phone calls are covered separately in [Telephony and SIP](/gpt-live-telephony/). "
                       "That API path is documented by OpenAI; the `realtime` keys below configure Codex voice sessions.\n")
        if g.startswith("Hidden"):
            out.append("The generated schema omits these keys, but this build's deserializer still recognizes them. Most "
                       "are legacy spellings kept so older config files still load. A few are recognized only so Codex/ChatGPT "
                       "can raise a targeted error. Each entry records how the shipped binary treated a one-key test "
                       "config under `--strict-config`.\n")
        if g.startswith("Documented but not"):
            out.append("The official reference lists these keys, but they are absent from this build's generated schema. "
                       "Each entry shows whether a config struct has a field of the same name, and what the binary did "
                       "with a `--strict-config` test. The docs are a live snapshot and probably describe a newer Codex/ChatGPT "
                       "release than the one bundled here.\n")
        if g.startswith("Managed requirements"):
            out.append("`requirements.toml` is the admin-managed policy file. It constrains what `config.toml` may set. "
                       "The keys come from the official reference, and the source location is given where a matching "
                       "field exists.\n")
        if g == "Feature flags":
            out.append("Set these under `[features]` in `config.toml`, or with `--enable <name>` and `--disable <name>`. "
                       "The stage and source default come from the feature registry "
                       "(`codex-rs/features/src/lib.rs`). \"On here\" is what `codex features list` reported for this "
                       "macOS binary with an empty `CODEX_HOME`.\n")
        for it in its:
            d = it["details"]
            out.append(f"### {code(it['title'])}\n")
            meta = []
            if d.get("type"):
                meta.append(f"Type: {code(d['type'])}")
            if d.get("stage"):
                meta.append(f"Stage: {d['stage']}")
            if d.get("default") is not None:
                meta.append(f"Default: {code(d['default'])}")
            if "enabled_on_this_build_with_empty_config" in d and d["enabled_on_this_build_with_empty_config"] is not None:
                meta.append(f"On here: {'yes' if d['enabled_on_this_build_with_empty_config'] else 'no'}")
            meta.append(f"Status: {d['status']}")
            if it.get("when"):
                meta.append(f"When: {it['when']}")
            out.append(" · ".join(meta) + "\n")
            dl = desc_line(d.get("description"))
            if dl:
                out.append(dl + "\n")
            if d.get("experimental_menu") and d["experimental_menu"].get("name"):
                out.append(f"Experimental menu: \"{d['experimental_menu']['name']}\"\n")
            if d.get("canonical"):
                out.append(f"Canonical key: {code(d['canonical'])}\n")
            if d.get("legacy_aliases"):
                out.append("Legacy aliases: " + ", ".join(code('features.' + a) for a in d["legacy_aliases"]) + "\n")
            fv = fmt_values(d.get("values"))
            if fv:
                out.append(fv + "\n")
            if d.get("profile_keys") and it["title"] in ("profiles.<name>",):
                out.append("Profile keys: " + ", ".join(code(k) for k in d["profile_keys"]) + "\n")
            if d.get("events"):
                out.append("Events: " + ", ".join(code(e) for e in d["events"]) + "\n")
            if d.get("consistency_notes"):
                out.append("Note: " + "; ".join(d["consistency_notes"]) + "\n")
            if "config_source_field" in d:
                out.append("Config struct field with this name: " + (src_link(d["config_source_field"]) if d["config_source_field"] else "none found") + "\n")
            probe = d.get("strict_config_probe")
            if probe:
                out.append(f"Binary check (`--strict-config`): {probe['result']}\n")
            claims = d.get("default_claims") or []
            if len({c["value"] for c in claims}) > 1:
                out.append("Default sources: " + "; ".join(f"{code(c['value'])} ({c['note']})" for c in claims) + "\n")
            srcs = []
            for p in it["provenance"]:
                if p["source"].startswith("codex-rs@") and len(srcs) < 2:
                    srcs.append(src_link(p["source"]))
            docs = d.get("docs_urls") or []
            tail = []
            if srcs:
                tail.append("Source: " + ", ".join(srcs))
            if docs:
                tail.append("Docs: " + ", ".join(f"[{u.split('/codex/')[-1]}]({u})" for u in docs[:3]))
            b = d.get("binary")
            if b is not None and not it["id"].startswith("config:requirements:"):
                tail.append("In binary: " + (f"yes ({b['strength']} match)" if b["present"] else "string not found"))
            if tail:
                out.append(" · ".join(tail) + "\n")
            if it["title"] == "realtime":
                out.append("For phone calls, see [GPT-Live telephony and SIP](/gpt-live-telephony/). "
                           "SIP is an API connection path, not a value of Codex's `realtime.transport` setting.\n")
    (OUT / "codex-config.md").write_text("\n".join(out).rstrip() + "\n")


def render_env():
    doc = json.loads((OUT / "codex-env-vars.json").read_text())
    items = doc["items"]
    v = doc["version"]
    groups = by_group(items)
    cli_read = [i for i in items if i["details"]["read_by"].startswith("CLI") and not i["group"].startswith(("Set or", "Build-time"))]
    desktop = [i for i in items if "desktop app" in i["details"]["read_by"]]
    desktop_own = [i for i in desktop if i["group"] != "Desktop app: platform and bundled-library variables"]
    child = groups.get("Set or cleared by Codex/ChatGPT for child processes", [])
    documented = sum(1 for i in items if i["documented"])
    out = ["# Codex/ChatGPT environment variables\n"]
    out.append(
        f"This page lists every environment variable that the Codex CLI bundled in the ChatGPT desktop app "
        f"({v['desktop_app']}; `{v['codex_cli']}`) or the desktop app's own main-process code reads, sets, or compiles "
        f"in. CLI entries come from `std::env` read sites, clap `env` attributes and indirect name tables in openai/codex "
        f"at tag `{v['source_tag']}`, and each name was checked against the shipped binary's strings. Desktop entries "
        f"come from `process.env` reads in `app.asar` (`.vite/build/*.js`). There are {len(items)} entries. "
        f"{len(cli_read)} are runtime variables read by the CLI. {len(desktop)} names are read in the desktop "
        f"main-process bundles; {len(desktop_own)} of those are Codex/ChatGPT's own, and the rest are platform or "
        f"bundled-library names. {len(child)} are set or cleared only for commands Codex/ChatGPT spawns. These categories "
        f"overlap: for example, `CODEX_HOME` is read by both the CLI and the desktop app. The rest are build-time "
        f"names, and names present only in source for other platforms or tests. {documented} appear in the official "
        f"Codex docs (the environment-variables table or a code span on another docs page), and "
        f"{len(items) - documented} are undocumented. \"Read as\" describes what the code does with the value: "
        f"`presence` means only set versus unset matters. A `(name)` basis means the kind is inferred from the "
        f"variable's name, not from the code. Descriptions quote the docs or the nearest source comment, and are "
        f"left out when neither exists.\n"
    )
    out.append("## Contents\n")
    for g, its in groups.items():
        anchor = re.sub(r"[^a-z0-9 -]", "", g.lower()).replace(" ", "-")
        out.append(f"- [{g}](#{anchor}) ({len(its)})")
    out.append("")
    notes = {
        "Set or cleared by Codex/ChatGPT for child processes": "Codex/ChatGPT sets or removes these in the environment of processes it spawns: shell tool commands, hooks, git, installers and the network proxy. Tools and hooks running under Codex can read them.",
        "Build-time variables (compiled in)": "These are read by `env!` or `option_env!` when the binary is built. Setting them at runtime has no effect.",
        "Desktop app: platform and bundled-library variables": "These are generic platform variables, or variables read by third-party libraries bundled into the desktop app's main-process JavaScript, such as Sentry release detection, OpenTelemetry, and `ws`. They are listed for completeness.",
        "In source only (not in this macOS binary: other-platform, test or dev builds)": "These are read in openai/codex at this tag, but the name string is absent from the macOS binary. They are Windows-only or Linux-only, test harnesses, or dev builds.",
    }
    for g, its in groups.items():
        out.append(f"## {g}\n")
        if g in notes:
            out.append(notes[g] + "\n")
        for it in its:
            d = it["details"]
            out.append(f"### {code(it['title'])}\n")
            meta = [f"Read by: {d['read_by']}"]
            if d.get("read_as"):
                basis = d.get("read_as_basis") or []
                meta.append("Read as: " + ", ".join(d["read_as"]) + (" (name)" if basis == ["name"] else ""))
            if d.get("default"):
                meta.append(f"Default: {d['default']['text']}")
            meta.append("Documented" if it["documented"] else "Undocumented")
            out.append(" · ".join(meta) + "\n")
            dl = desc_line(d.get("description"))
            if dl:
                out.append(dl + "\n")
            if d.get("values_set_for_child"):
                out.append("Value Codex/ChatGPT sets: " + ", ".join(code(x) for x in d["values_set_for_child"]) + "\n")
            if d.get("used_in_functions"):
                out.append("Used in: " + ", ".join(code(f) for f in d["used_in_functions"][:5]) + "\n")
            if d.get("clap_subcommands"):
                out.append("CLI flag fallback for: " + ", ".join(code(c) for c in d["clap_subcommands"]) + "\n")
            srcs = [src_link(p["source"]) for p in it["provenance"] if p["source"].startswith(("codex-rs@", "app.asar"))][:3]
            tail = []
            if srcs:
                tail.append("Source: " + ", ".join(srcs))
            if d.get("set_for_child_sites") and not g.startswith("Set or"):
                tail.append("Also set for child processes")
            if d.get("docs_urls"):
                tail.append("Docs: " + ", ".join(f"[{u.split('/codex/')[-1]}]({u})" for u in d["docs_urls"][:3]))
            if tail:
                out.append(" · ".join(tail) + "\n")
    (OUT / "codex-env-vars.md").write_text("\n".join(out).rstrip() + "\n")


if __name__ == "__main__":
    render_config()
    render_env()
    print("rendered", OUT / "codex-config.md", OUT / "codex-env-vars.md")
