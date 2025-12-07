import Phaser from 'phaser';
import GameScene from './scenes/GameScene';
import UIScene from './scenes/UIScene';

// @ts-ignore
import VirtualJoystickPlugin from 'phaser3-rex-plugins/plugins/virtualjoystick-plugin.js';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 1280, // 配信向けに少し広め
  height: 720,
  parent: 'app',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0, x: 0 }, // トップダウンなので重力はゼロ
      debug: false // 制作中はtrueにすると当たり判定が見えて便利
    },
  },
  scene: [GameScene, UIScene], // ここにシーンを追加していく
  pixelArt: true, // ドット絵が綺麗に見える設定
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  }
};

new Phaser.Game(config);