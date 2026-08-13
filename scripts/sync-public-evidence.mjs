import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const sourceRoot = resolve(process.argv[2] ?? '../cursor-os-base')
const outputRoot = resolve(process.argv[3] ?? 'public')
const capabilityPath = resolve(sourceRoot, 'capabilities.json')
const benchmarkPath = resolve(sourceRoot, 'benchmarks.json')

const readSnapshot = async (path) => {
  const bytes = await readFile(path)
  return {
    data: JSON.parse(bytes.toString('utf8')),
    sha256: createHash('sha256').update(bytes).digest('hex'),
  }
}

const sourceCommit = execFileSync('git', ['-C', sourceRoot, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim()
const [capabilitySnapshot, benchmarkSnapshot] = await Promise.all([
  readSnapshot(capabilityPath),
  readSnapshot(benchmarkPath),
])

const source = {
  repository: 'https://github.com/VyomKulshrestha/Ferrum-OS',
  commit: sourceCommit,
  snapshotDate: benchmarkSnapshot.data.snapshot_date,
}

const capabilities = {
  $schema: 'https://ferrum-os.vercel.app/schemas/capabilities-v2.schema.json',
  schemaVersion: 2,
  project: 'FerrumOS',
  releaseVersion: '0.1.1',
  source: {
    ...source,
    sha256: capabilitySnapshot.sha256,
    generatedFrom: capabilitySnapshot.data.generated_from,
  },
  counts: {
    canonicalExecutableOperations: capabilitySnapshot.data.canonical_action_count,
    modelAdvertisedOperations: 37,
    kernelSyscalls: 61,
    permissionTiers: capabilitySnapshot.data.permission_tier_count,
  },
  runtime: {
    platform: capabilitySnapshot.data.platform,
    agentPlacement: 'Ring 3',
    unknownActionPolicy: capabilitySnapshot.data.unknown_action_policy,
  },
  safety: {
    deterministicPolicy: 'authoritative',
    learnedWorldModel: 'advisory-monotonic',
    learnedAllowGrantsAuthority: false,
    physicalWorldModel: 'shadow-only',
    neuralIntent: 'proposal-only',
  },
  actions: capabilitySnapshot.data.actions,
  claimBoundaries: capabilitySnapshot.data.claim_boundary,
}

const sourceBenchmarks = benchmarkSnapshot.data
const paper = sourceBenchmarks.paper_release
const preview = sourceBenchmarks.current_ring3_preview
const physical = sourceBenchmarks.physical_simulator_jepa
const neural = sourceBenchmarks.neural_synthetic
const qemu = sourceBenchmarks.qemu_command_audit

const benchmarks = {
  $schema: 'https://ferrum-os.vercel.app/schemas/benchmarks-v2.schema.json',
  schemaVersion: 2,
  project: 'FerrumOS',
  releaseVersion: '0.1.1',
  researchVersion: '1.0.0',
  source: {
    ...source,
    sha256: benchmarkSnapshot.sha256,
    raw: 'https://raw.githubusercontent.com/VyomKulshrestha/Ferrum-OS/main/benchmarks.json',
  },
  benchmarks: [
    {
      id: 'os-safety-fixture-rules-jepa',
      metric: 'balanced_accuracy',
      value: paper.rules_plus_jepa_balanced_accuracy,
      unit: 'ratio',
      sampleSize: paper.fixture_episodes,
      falseNegativeRate: paper.rules_plus_jepa_false_negative_rate,
      falsePositiveRate: paper.rules_plus_jepa_false_positive_rate,
      protocol: 'authored-balanced-counterfactual-fixture',
      boundary: paper.claim_boundary,
    },
    {
      id: 'os-safety-fixture-rules-action-mean',
      metric: 'balanced_accuracy',
      value: paper.rules_plus_mean_balanced_accuracy,
      unit: 'ratio',
      sampleSize: paper.fixture_episodes,
      protocol: 'authored-balanced-counterfactual-fixture',
      boundary: 'Simple baseline; no material JEPA advantage established.',
    },
    {
      id: 'ring3-preview-h1',
      metric: 'mean_preview_latency',
      range: preview.horizons[0].mean_microseconds_range,
      unit: 'microseconds',
      samplesPerRun: preview.iterations_per_horizon_per_run,
      runs: preview.runs,
      protocol: 'qemu-whpx-ring3-preview',
      boundary: 'Excludes provider inference, action dispatch, execution, and approval latency.',
    },
    {
      id: 'ring3-preview-h5',
      metric: 'mean_preview_latency',
      range: preview.horizons[4].mean_microseconds_range,
      unit: 'microseconds',
      samplesPerRun: preview.iterations_per_horizon_per_run,
      runs: preview.runs,
      protocol: 'qemu-whpx-ring3-preview',
      boundary: 'Bounded lookahead in the same QEMU/WHPX profile.',
    },
    {
      id: 'physical-jepa-simulator',
      metric: 'balanced_accuracy',
      value: physical.rules_plus_jepa_balanced_accuracy,
      unit: 'ratio',
      sampleSize: physical.episodes,
      falseNegatives: physical.false_negatives,
      falsePositives: physical.false_positives,
      protocol: 'deterministic-physical-simulator',
      boundary: physical.claim_boundary,
    },
    {
      id: 'neural-synthetic-contract',
      metric: 'contract_trials',
      signalTrials: neural.signal_trials,
      acceptedSignalAccuracy: neural.accepted_signal_accuracy,
      artifactTrials: neural.artifact_trials,
      artifactAbstentionRate: neural.artifact_abstention_rate,
      noControlWindows: neural.no_control_windows,
      emittedIntents: neural.emitted_intents,
      protocol: 'deterministic-synthetic-eeg-contract',
      boundary: neural.claim_boundary,
    },
    {
      id: 'qemu-command-audit',
      metric: 'passing_command_paths',
      focusedCases: qemu.command_sweep_cases,
      focusedPassed: qemu.command_sweep_passed,
      catalogEntries: qemu.catalog_entries,
      catalogPassed: qemu.catalog_passed,
      unknownCommandPaths: qemu.unknown_command_paths,
      protocol: qemu.protocol_id,
      boundary: qemu.claim_boundary,
    },
  ],
  protocols: sourceBenchmarks,
  globalLimitations: sourceBenchmarks.global_limitations,
}

const writeJson = (name, value) =>
  writeFile(resolve(outputRoot, name), `${JSON.stringify(value, null, 2)}\n`, 'utf8')

const snapshotPages = [
  resolve('proof.html'),
  resolve('research.html'),
  resolve(outputRoot, 'proof.md'),
  resolve(outputRoot, 'research.md'),
]

const syncSnapshotCommit = async (path) => {
  const content = await readFile(path, 'utf8')
  const updated = content.replace(/[0-9a-f]{40}/g, sourceCommit)
  await writeFile(path, updated, 'utf8')
}

await Promise.all([
  writeJson('capabilities.json', capabilities),
  writeJson('benchmarks.json', benchmarks),
  ...snapshotPages.map(syncSnapshotCommit),
])

console.log(`Synced FerrumOS evidence from ${sourceCommit}`)
