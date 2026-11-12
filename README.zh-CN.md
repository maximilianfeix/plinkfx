<img alt="plinkfx" src="brand/banners/readme-light.svg" width="100%">

# plinkfx

**163 个游戏音效，全部用代码写成。** 金币、跳跃、打击、激光、爆炸、UI 点击等等，每个音效只是几个数字，由 2 KB 的播放器实时合成。CC0 授权，没有音频文件，无需注册。

**[▶ 在线试听全部音效](https://maximilianfeix.github.io/plinkfx/)** · [30 秒小游戏演示](https://maximilianfeix.github.io/plinkfx/game.html)

```bash
npm i plinkfx
```

```js
import { play } from "plinkfx";

play("coin");
```

每次调用会从 4 个变体中随机选一个，第一百个金币也不会听起来像循环。

## 包含哪些音效

| 分类 | 数量 | 示例 |
|---|---:|---|
| UI | 23 | `click` `toggle-on` `confirm` `error` `notify` `plink` |
| 拾取 | 15 | `coin` `coin-double` `gem` `key` `heart` `ka-ching` |
| 跳跃与落地 | 10 | `jump` `jump-double` `land` `land-heavy` `spring` |
| 打击 | 15 | `hit` `hit-heavy` `punch` `hurt` `enemy-die` `sword-hit` |
| 爆炸 | 10 | `explosion` `explosion-big` `explosion-retro` `firework` |
| 强化 | 12 | `powerup` `level-up` `extra-life` `shield-on` `heal` |
| 射击与激光 | 14 | `laser` `blaster` `zap` `pew` `gunshot` `reload` |
| 脚步 | 10 | `step-grass` `step-stone` `step-wood` `step-snow` |
| 魔法 | 12 | `sparkle` `fireball` `ice` `teleport` `lightning` |
| 提示 | 10 | `alarm` `warning` `low-health` `countdown` |
| 短旋律 | 8 | `victory` `level-complete` `game-over` `achievement` |
| 门与机关 | 10 | `door-open` `door-heavy` `chest-open` `lever` |
| 环境 | 12 | `whoosh` `splash` `water-drop` `wind` `glass-break` |

## 用法

```js
import { play } from "plinkfx/core";      // 只打包用到的音效：播放器 + 一个音效约 2.2 KB (gzip)
import { coin, jump } from "plinkfx/sounds";

play(coin);
play(jump, { volume: 0.5 });
```

导出给 Godot、Unity、Phaser 等引擎：

```bash
npx plinkfx export sfx/                 # 每个音效导出为 48 kHz 单声道 WAV
npx plinkfx export sfx/ --format both   # WAV + OGG（OGG 需要 ffmpeg）
```

## Agent 技能

支持 Claude Code、Codex、Cursor：描述你想要的声音（例如“地牢里沉重的大门”），Agent 会从最接近的音效出发写出参数，渲染、测量（响度、真峰值、时长、亮度）并调整。完全离线运行。Agent 听不到声音，所以最后由你来试听。

```bash
npx skills add maximilianfeix/plinkfx
```

## 质量检查

每个音效都经过测量：按分类设定响度目标（ITU-R BS.1770），真峰值 ≤ −1 dBTP，无直流偏移，首尾无爆音，同样参数总是生成相同的采样（测试中有哈希校验），并在 Linux、macOS、Windows 上运行测试。

## 授权

- **音效：CC0 1.0（公共领域）**，可用于任何项目，商用也可以，**无需署名**。
- **代码：MIT。**

[English README](README.md)
