# Changelog

## 5.1.0

- Add PAX write capability for `ArchiveWriter`
  - Note: PAX headers will only be added as necessary for files / directories that exceed original field bounds of the USTAR header (namely, the `fileName` field)

## 5.0.0

- Rename `Tarball` class to `Archive`
- Split out read and write functionality into new classes `ArchiveReader` and `ArchiveWriter`
- Rename `AsyncUint8Array` interface to `AsyncUint8ArrayLike`
- Refactor all parsing logic to run through the `AsyncUint8ArrayLike` interface to de-duplicate sync vs async operations
- Add PAX header read support

## 4.0.0

- Remove `TarEntryAttributes` class (entry merging functionality migrated into `TarEntry` class)
- Remove `TarEntryMetadata` class (buffer parsing functionality migrated into `TarEntry` class)
- Misc optimizations to reduce unnecessary creation of `Uint8Array` instances when parsing or combining tar entries
- Overhaul `TarHeader` to be a top-level class rather than just an interface
- Refactor `TarHeader` property access/updates to be lazy to save on performance (serialize/deserialize do not happen unless the property is accessed)
