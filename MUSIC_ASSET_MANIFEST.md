# 音源文件清单

播放器会优先加载 `.flac`，其次 `.wav`，最后 `.mp3`。把已取得授权的音频文件放入 `assets/audio/`，文件名 stem 必须与下表一致。

| 曲目 | 文件名 stem | 当前状态 | 来源入口 |
| --- | --- | --- | --- |
| 世界第一的公主殿下 | `assets/bgm.mp3` | 本地 | https://www.qobuz.com/us-en/album/the-world-is-mine-feat-hatsune-miku-supercell/wxvvohi9kvk5a |
| 妄想感伤代偿连盟 | `mousou-kanshou-daishou-renmei` | 待文件 | https://ototoy.jp/_/default/p/67624 |
| 千本樱 | `senbonzakura` | 待文件 | https://ototoy.jp/_/default/p/26309 |
| Melt | `melt` | 待文件 | https://www.qobuz.com/us-en/album/supercell-feat-hatsune-miku-supercell/hh7pe4wnyoisb |
| Tell Your World | `tell-your-world` | 待文件 | https://karent.jp/album/1615 |
| 罗密欧与灰姑娘 | `romeo-and-cinderella` | 待文件 | https://karent.jp/album/58 |
| 初音未来的消失 | `disappearance-of-hatsune-miku` | 待文件 | https://karent.jp/album/1098 |
| 爱言叶 | `ai-kotoba` | 待文件 | https://ototoy.jp/_/default/p/39207 |
| 砂之惑星 | `sand-planet` | 待文件 | https://karent.jp/cd/magical2017 |
| ODDS&ENDS | `odds-and-ends` | 待文件 | https://karent.jp/cd/magical2014 |

严格验收命令：

```shell
npm run test:music-assets
```

该命令只有在 10 首歌都有可用音频文件时才会通过。

授权文件导入命令：

```shell
npm run import:music-assets -- --from "D:\path\to\authorized-audio"
```

脚本会识别常见中日英歌名别名，并复制为播放器约定的文件名。不要导入盗链、网盘搬运、P2P 或规避 DRM 得到的音频。
