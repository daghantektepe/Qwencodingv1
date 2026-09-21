# Architecture

OpenScriv is local-first by design.

- Electron main owns file-system access.
- Preload exposes a tiny IPC bridge.
- React renderer owns editing state and UI.
- Project manifests are JSON files stored in a local project directory.
- Tests cover rendering, editing, and word-count behavior.

Future phases can add drag-and-drop binder editing, snapshots, compile/export, and installer packaging without changing this split.
