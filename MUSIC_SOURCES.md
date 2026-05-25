# 初音未来曲库合法音源来源记录

本项目不从盗链、网盘搬运、P2P 或规避 DRM 的来源下载音乐。音源进入 `assets/audio/` 前，需要确认来源允许下载并保留购买或授权记录。

## 已列入播放器的曲目

| 曲目 | 制作者 | 当前接入 | 合法来源入口 |
| --- | --- | --- | --- |
| 世界第一的公主殿下 | ryo (supercell) | `assets/bgm.mp3` | https://www.qobuz.com/us-en/album/the-world-is-mine-feat-hatsune-miku-supercell/wxvvohi9kvk5a |
| 妄想感伤代偿连盟 | DECO*27 | 待放入 `assets/audio/` | https://ototoy.jp/_/default/p/67624 |
| 千本樱 | 黒うさP | 待放入 `assets/audio/` | https://ototoy.jp/_/default/p/26309 |
| Melt | ryo (supercell) | 待放入 `assets/audio/` | https://www.qobuz.com/us-en/album/supercell-feat-hatsune-miku-supercell/hh7pe4wnyoisb |
| Tell Your World | kz (livetune) | 待放入 `assets/audio/` | https://karent.jp/album/1615 |
| 罗密欧与灰姑娘 | doriko | 待放入 `assets/audio/` | https://karent.jp/album/58 |
| 初音未来的消失 | cosMo@暴走P | 待放入 `assets/audio/` | https://karent.jp/album/1098 |
| 爱言叶 | DECO*27 | 待放入 `assets/audio/` | https://ototoy.jp/_/default/p/39207 |
| 砂之惑星 | HACHI | 待放入 `assets/audio/` | https://karent.jp/cd/magical2017 |
| ODDS&ENDS | ryo (supercell) | 待放入 `assets/audio/` | https://karent.jp/cd/magical2014 |

## 接入约定

- 首曲继续使用现有 `assets/bgm.mp3`。
- 其他歌曲放入 `assets/audio/`，文件名 stem 与 `MUSIC_ASSET_MANIFEST.md` 保持一致。
- `index.html` 会按 `.flac`、`.wav`、`.mp3` 顺序尝试加载，不需要为格式切换改代码。
