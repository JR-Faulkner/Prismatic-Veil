# Sequence Lab v0.2 Manifest Notes

The v0.2 Sequence Lab supports two source styles:

- direct per-frame `asset` paths
- `sheet` references into a manifest-level `sheets` map

For sheet-backed sequences, each frame supplies a `cell` index. Current PV authority sheets use a 3x2 grid and reading-order cells 1..6.

A sheet entry may include `backgroundKey: "edge-white"` for approved JPEG authority sheets on white. The runtime removes only edge-connected near-white pixels so costume whites remain intact.

`signatureReady: true` means the Lab must play the approved authority sequence. Bootstrap `previewFrames` are only valid when no approved authority source is available.

Current v0.2 authority set:

- Prismel staff materialization: 6 cells
- Prismel Prismatic Shard attack: 6 cells
- Auryi Auorb: 6 cells
- Kineza gauntlet ignition: 6 cells
