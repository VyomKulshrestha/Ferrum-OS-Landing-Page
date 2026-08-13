# FerrumOS evidence and limitations

Current-main evidence snapshot: [`8d347469371f30fb33652b64ed931abdcf6319d7`](https://github.com/VyomKulshrestha/Ferrum-OS/commit/8d347469371f30fb33652b64ed931abdcf6319d7).

FerrumOS v0.1.1 is a bootable Rust x86-64 research operating system. Its agent runs in Ring 3 and all effects remain subject to kernel capabilities, operator confirmation where required, syscall validation, deterministic policy, and a monotonic predictive screening gate.

## Verified system surface

- 41 canonical executable operations
- 37 operations advertised directly to the model
- 61 kernel syscalls numbered 0–60
- 5 permission tiers
- Unknown operations fail closed
- A dated emulator audit passed 101/101 focused command cases and 81/81 exhaustive catalog entries for OS source [`c92056d`](https://github.com/VyomKulshrestha/Ferrum-OS/commit/c92056d8635af5e4ee2a81351350b1b25cfd4861); its record is included in the current snapshot above

## World-model fixture

- Rules + JEPA: 81.4% balanced accuracy, 20.8% false-negative rate, 16.4% false-positive rate
- Rules + per-action mean: 81.2% balanced accuracy
- Corpus: 13,697 transitions from 3,639 QEMU episodes

This is a balanced authored counterfactual fixture. It is not natural-use prevalence, independent human annotation, live destructive execution, formal verification, or a certified safety result. The simple baseline result means no material JEPA safety advantage has been established on this fixture.

## Research boundaries

- The physical JEPA is simulator-only and permanently shadow-only.
- Neural evidence is deterministic and synthetic; there is no live-EEG or human accuracy claim.
- FerrumOS makes no medical, diagnostic, mind-reading, real-robot, camera-accuracy, hardware-in-the-loop, or learned actuator-permit claim.

## Primary sources

- [Technical report](https://doi.org/10.5281/zenodo.21829808)
- [Dataset](https://doi.org/10.5281/zenodo.21829193)
- [Source repository](https://github.com/VyomKulshrestha/Ferrum-OS)
- [Benchmark definitions](https://github.com/VyomKulshrestha/Ferrum-OS/blob/main/docs/BENCHMARKS.md)
- [Versioned capability snapshot](https://ferrum-os.vercel.app/capabilities.json)
- [Versioned benchmark snapshot](https://ferrum-os.vercel.app/benchmarks.json)

## Release boundary

v0.1.1 is the latest tagged software release. Current main contains newer research work. The machine-readable snapshots carry a source commit and SHA-256 hash so a quantitative claim can be tied to exact evidence rather than silently attributed to the older tag.
