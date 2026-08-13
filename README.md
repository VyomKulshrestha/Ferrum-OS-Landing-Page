# FerrumOS landing page

The public cinematic and evidence layer for [FerrumOS](https://github.com/VyomKulshrestha/Ferrum-OS), a bootable Rust x86-64 research operating system where an AI agent runs in Ring 3 and learned predictions can add caution but never grant authority.

## Experience

The landing page is one continuous eight-leg camera journey:

1. Rust kernel forge
2. Ring-3 authority boundary
3. Graphical userland
4. Capability-gated action foundry
5. Deterministic + JEPA future preview
6. Reproducible evidence vault
7. Bounded physical and neural research
8. Open-source horizon

Every clip begins from a lossless PNG extracted from the actual final frame of the previous Veo clip. Technical copy remains semantic HTML rather than generated text inside video.

## Evidence surfaces

- `/proof` — measured results, baselines, and limitations
- `/research` — world-model, physical simulator, and neural claim boundaries
- `/capabilities.json` — machine-readable system surface
- `/benchmarks.json` — machine-readable benchmark summary
- `/proof.md`, `/research.md`, `/llms.txt`, and `/llms-full.txt` — compact and full agent-readable context
- `/releases.json` and `/changelog.md` — release-versus-main boundaries
- `/.well-known/ferrumos-docs.json`, `/.well-known/api-catalog`, and `/openapi.json` — read-only documentation discovery; never runtime-control endpoints

The capability and benchmark documents identify the exact FerrumOS source commit and SHA-256 content hash used for each website snapshot. Refresh them from a sibling FerrumOS checkout with:

```bash
node scripts/sync-public-evidence.mjs ../cursor-os-base public
```

FerrumOS v0.1.1 is a research OS and QEMU appliance. Physical results are simulator-only, neural results are synthetic/recorded evidence only, and no formal-safety, medical, live-EEG, real-robot, or broad-PC-compatibility claim is made.

## Local development

```bash
npm ci
npm run dev
```

Run the production checks:

```bash
npm run check
```

The continuous visual journey and its handoff/quality rules are documented in [`docs/CINEMATIC_ROUTE.md`](docs/CINEMATIC_ROUTE.md).

The site is a Vite multipage build deployed with Vercel.

## Primary research

- [Technical report](https://doi.org/10.5281/zenodo.21829808)
- [Dataset v1.0.0](https://doi.org/10.5281/zenodo.21829193)
- [Frozen research release](https://github.com/VyomKulshrestha/Ferrum-OS/releases/tag/world-model-study-v1.0.0)

## License

MIT
