# FerrumOS world-model and neural research

Current-main evidence snapshot: [`84926841a401760b869af158ee80b0e709d0d6af`](https://github.com/VyomKulshrestha/Ferrum-OS/commit/84926841a401760b869af158ee80b0e709d0d6af).

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

The physical JEPA result comes from deterministic simulator traces. It is permanently shadow-only and cannot create an actuator permit or override a deterministic stop. The surrounding simulator-backed software tier now binds versioned sessions, replay/faults, virtual devices, simulator bridges, deterministic supervision, ROS 2/MQTT/CAN conformance, actuator-disabled delivery, bounded neural proposals, and host-managed cells.

The named regression snapshot records 152/152 deterministic contract tests and 32/32 model/decoder gates passing. It is not evidence of installed simulator/transport infrastructure, native hypervisor containment, real-robot, camera, live hardware-in-the-loop, hard-real-time, or general physical-safety performance.

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
