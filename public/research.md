# FerrumOS world-model and neural research

Current-main evidence snapshot: [`7e8f1014e7fbe1825a1066b3384931d77fed5c23`](https://github.com/VyomKulshrestha/Ferrum-OS/commit/7e8f1014e7fbe1825a1066b3384931d77fed5c23).

FerrumOS studies a narrow systems question: can a learned forecast add caution before an operating-system action while deterministic policy and the kernel retain final authority?

## Authority model

Eligible actions are projected through independent deterministic and action-conditioned JEPA transition models. Their risk results combine monotonically: the riskier result wins. A learned result can therefore pause or escalate an action, but it cannot grant a capability, bypass operator confirmation, remove a deterministic warning, or authorize a syscall.

## Published world-model study

- Corpus: 13,697 accepted state-action-next-state transitions from 3,639 QEMU episodes.
- Fitting rows: 13,270.
- Authored evaluation fixture: 500 balanced episodes.
- Rules plus action-conditioned JEPA: 81.4% balanced accuracy.
- Rules plus per-action mean: 81.2% balanced accuracy.

The 0.2 percentage-point difference does not establish a material JEPA safety advantage over the simple baseline. The authored fixture is not natural-use prevalence, independent human annotation, formal verification, or certified safety evidence.

## Physical prediction boundary

The physical JEPA result comes from deterministic simulator traces. It is permanently shadow-only and cannot create an actuator permit or override a deterministic stop. It is not evidence of real-robot, camera, hardware-in-the-loop, or general physical-safety performance.

## Neural intent boundary

The neural path uses deterministic synthetic or recorded EEG evidence, artifact abstention, explicit non-neural arming, signed evidence, and proposal-only UI or read-only goals. No human-participant or live-EEG accuracy has been measured. FerrumOS makes no diagnostic, clinical, medical, thought-decoding, mind-reading, or silent physical-control claim.

## Primary artifacts

- [Technical report](https://doi.org/10.5281/zenodo.21829808)
- [World-model dataset v1.0.0](https://doi.org/10.5281/zenodo.21829193)
- [Frozen research release](https://github.com/VyomKulshrestha/Ferrum-OS/releases/tag/world-model-study-v1.0.0)
- [Machine-readable benchmark snapshot](https://ferrum-os.vercel.app/benchmarks.json)
- [Evidence and limitations](https://ferrum-os.vercel.app/proof.md)
- [FerrumOS source](https://github.com/VyomKulshrestha/Ferrum-OS)

FerrumOS v0.1.1 is the latest tagged software release. Current main contains newer research work and may differ from that tag.
