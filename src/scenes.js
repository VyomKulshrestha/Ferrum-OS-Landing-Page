export const scenes = [
  {
    id: 'forge',
    number: '01',
    chapter: 'Boot below the app layer',
    title: 'An agentic OS, forged from the kernel up.',
    body:
      'FerrumOS boots a Rust x86-64 kernel and a real Ring-3 userland. Intelligence lives above the kernel; scheduling, memory, interrupts, and drivers stay deterministic.',
    tags: ['Rust + x86-64', 'Bootable research OS', 'Deterministic kernel'],
    note:
      'Validated against the documented QEMU/Bochs profile—not broad PC compatibility or a production hardware deployment.',
    video: '/media/scene-01.mp4',
    poster: '/posters-webp/scene-01-opening.webp',
    align: 'left',
    scroll: 1.95,
  },
  {
    id: 'boundary',
    number: '02',
    chapter: 'Intelligence, contained',
    title: 'The brain runs in userspace. Authority does not.',
    body:
      'Heliox can observe, plan, act, verify, and reflect, but every system effect crosses FerrumOS’s syscall ABI. Default-deny capabilities remain the kernel’s authority boundary.',
    tags: ['Real Ring 3', '61 syscalls', 'Default deny'],
    note:
      'The model is not kernel-resident and has no unrestricted hardware authority. A predictive allow is never permission to execute.',
    video: '/media/scene-02.mp4',
    poster: '/posters-webp/scene-02.webp',
    align: 'right',
    scroll: 1.8,
  },
  {
    id: 'userland',
    number: '03',
    chapter: 'A real userland',
    title: 'Not an agent demo. An operating system around it.',
    body:
      'FerrumOS runs ELF processes, a graphical desktop, persistent Ext2 storage, networking, audio, notifications, and signed local packages. Heliox uses the same system boundaries as every Ring-3 process.',
    tags: ['ELF processes', 'Ext2 + networking', 'Signed packages'],
    note:
      'The package catalog is a local signed cache, not a network marketplace; device support remains scoped to the documented emulator profile.',
    video: '/media/scene-03.mp4',
    poster: '/posters-webp/scene-03.webp',
    align: 'left',
    scroll: 1.82,
  },
  {
    id: 'authority',
    number: '04',
    chapter: 'Capability before command',
    title: 'Every action earns its authority.',
    body:
      'Canonical operations cross five permission tiers and one common predictive gate. Modify and destructive paths retain operator confirmation, while unknown actions fail closed.',
    tags: ['41 operations', '5 permission tiers', 'Confirmation gates'],
    note:
      'Confirmation, capability checks, syscall validation, and predictive screening remain separate controls. Catalog membership is not proof of postcondition verification.',
    video: '/media/scene-04.mp4',
    poster: '/posters-webp/scene-04.webp',
    align: 'right',
    scroll: 1.85,
  },
  {
    id: 'world-model',
    number: '05',
    chapter: 'Preview before execution',
    title: 'Think forward before the system acts.',
    body:
      'FerrumOS previews bounded OS-state consequences with independent deterministic and learned forecasts. The riskier result wins before any eligible action reaches dispatch.',
    tags: ['H=3 lookahead', '1.29–1.57 ms preview', 'Monotonic safety'],
    note:
      'The learned model complements deterministic policy. It cannot erase a rule-based warning, bypass confirmation, or grant authority.',
    video: '/media/scene-05.mp4',
    poster: '/posters-webp/scene-05.webp',
    align: 'left',
    scroll: 2,
  },
  {
    id: 'evidence',
    number: '06',
    chapter: 'Measured, not mythologized',
    title: 'Reproducible evidence. Visible imperfections.',
    body:
      'FerrumOS publishes its transition data, evaluation protocol, raw artifacts, comparison baselines, and failure clusters. Misses remain visible instead of disappearing into product language.',
    tags: ['13,697 transitions', '81.4% fixture BA', 'Failure clusters'],
    note:
      'Authored counterfactual fixtures are not natural-use prevalence, independent human annotation, live destructive execution, or formal safety proof.',
    video: '/media/scene-06.mp4',
    poster: '/posters-webp/scene-06.webp',
    align: 'right',
    scroll: 1.88,
  },
  {
    id: 'inputs',
    number: '07',
    chapter: 'Simulator-backed cyber-physical tier',
    title: 'A complete software boundary. No borrowed hardware claims.',
    body:
      'Ferrum now binds deterministic sessions, replay, virtual devices, simulator bridges, watchdogs, ROS 2/MQTT/CAN conformance, actuator-disabled delivery, bounded neural proposals, and host-managed cells into one testable reference vertical.',
    tags: ['152 / 152 contracts', '32 / 32 model gates', 'Actuator disabled'],
    note:
      'These are local software contracts. There is no installed simulator or transport deployment, live EEG, native hypervisor, real robot, hard-real-time, certification, or independent-replication claim.',
    video: '/media/scene-07.mp4',
    poster: '/posters-webp/scene-07.webp',
    align: 'left',
    scroll: 1.9,
  },
  {
    id: 'horizon',
    number: '08',
    chapter: 'Open research, built to be challenged',
    title: 'Build the OS where intelligence answers to the system.',
    body:
      'Boot it. Reproduce the gate. Inspect the failures. Then help push agentic operating systems beyond application-layer automation—without hiding the limits.',
    tags: ['MIT licensed', 'Open data + report', 'Reproducible in QEMU'],
    note:
      'FerrumOS v0.1.1 is a research OS and QEMU appliance, not a production-ready general-purpose OS or certified safety platform.',
    video: '/media/scene-08.mp4',
    poster: '/posters-webp/scene-08.webp',
    align: 'center',
    scroll: 2.15,
    cta: true,
  },
]
