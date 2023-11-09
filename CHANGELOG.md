# CHANGELOG

## 4.0.0

- Remove `TarEntryAttributes` class (entry merging functionality migrated into `TarEntry` class)
- Remove `TarEntryMetadata` class (buffer parsing functionality migrated into `TarEntry` class)
- Misc optimizations to reduce unnecessary creation of `Uint8Array` instances when parsing or combining tar entries
- Overhaul `TarHeader` to be a top-level class rather than just an interface
- Refactor `TarHeader` property access/updates to be lazy to save on performance (serialize/deserialize do not happen unless the property is accessed)