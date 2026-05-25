# Music asset intake

Place only authorized audio files in this directory.

`index.html` automatically tries `.flac`, `.wav`, then `.mp3` for each track below, so the filename stem must match but the extension can be any supported format.

Expected first-pass playlist filename stems:

- `mousou-kanshou-daishou-renmei`
- `senbonzakura`
- `melt`
- `tell-your-world`
- `romeo-and-cinderella`
- `disappearance-of-hatsune-miku`
- `ai-kotoba`
- `sand-planet`
- `odds-and-ends`

Quality target: FLAC/WAV when legally available, otherwise 320kbps MP3. The first track currently uses `../bgm.mp3`.

To import authorized files from a local download/purchase folder:

```shell
npm run import:music-assets -- --from "D:\path\to\authorized-audio"
```

The import script accepts `.flac`, `.wav`, and `.mp3`, prefers them in that order, and copies matched files into this directory with the exact stems above. Use `--overwrite` when replacing an existing file.
