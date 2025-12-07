import Phaser from 'phaser';
// 先ほど作成したアセット管理ファイルをインポート
import { ASSETS } from '../AssetManifest';

export default class GameScene extends Phaser.Scene {
    // プレイヤー
    private player!: Phaser.Physics.Arcade.Sprite;

    // 操作入力
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys; // キーボード
    private joyStickCursors?: Phaser.Types.Input.Keyboard.CursorKeys; // ジョイスティック（型定義があやふやな場合があるので?をつける）
    private joyStick!: any; // プラグインの型定義を厳密に書くと長くなるので一旦anyで逃げます

    constructor() {
        super('GameScene');
    }

    preload() {
        // 1. アセットマニフェストから画像を読み込み開始
        Object.values(ASSETS).forEach((asset) => {
            this.load.image(asset.key, asset.path);
        });

        // ▼ 追加: 画像が見つからなかった時のリカバリー処理
        this.load.on(Phaser.Loader.Events.FILE_LOAD_ERROR, (file: Phaser.Loader.File) => {
            // どの画像が無かったかコンソールに警告を出す
            console.warn(`画像が見つかりません: ${file.key} -> 仮のテクスチャを生成します`);

            // 既にリカバリー済みなら何もしない
            if (this.textures.exists(file.key)) return;

            // 仮の四角形（マゼンタ色）をメモリ上で作る
            const graphics = this.make.graphics({ x: 0, y: 0, add: false });

            // 目立つ色（マゼンタ #FF00FF）にしておくと「画像入れ忘れてるぞ」と気づきやすい
            graphics.fillStyle(0xFF00FF);
            graphics.fillRect(0, 0, 32, 32);

            // "×"印を描いておく（お好みで）
            graphics.lineStyle(2, 0x000000);
            graphics.moveTo(0, 0);
            graphics.lineTo(32, 32);
            graphics.moveTo(32, 0);
            graphics.lineTo(0, 32);

            // 【重要】失敗したファイルと同じキー（名前）でテクスチャを登録する
            // これにより、create() 側は画像があるつもりで処理を続行できる
            graphics.generateTexture(file.key, 32, 32);

            // 使い終わったグラフィックオブジェクトは破棄
            graphics.destroy();
        });
    }

    create() {
        // --- 1. プレイヤーの作成 ---
        this.player = this.physics.add.sprite(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2,
            ASSETS.PLAYER.key
        );

        // 【重要】どんな画像が来てもこのサイズに強制変換（配信ネタ画像対策）
        this.player.setDisplaySize(32, 32);

        // 【重要】当たり判定は画像サイズに依存させず、少し小さめの円にする
        // （画像が長方形でも、当たり判定は中心の円になるので理不尽な当たり方をしない）
        this.player.setCircle(12);
        this.player.setOffset(4, 4); // 画像の中心と当たり判定の中心を合わせる調整

        this.player.setCollideWorldBounds(true);

        // --- 2. カメラの設定 ---
        this.cameras.main.startFollow(this.player);
        this.cameras.main.setBounds(0, 0, 2000, 2000);
        this.physics.world.setBounds(0, 0, 2000, 2000);

        // --- 3. 操作設定（キーボード） ---
        if (this.input.keyboard) {
            this.cursors = this.input.keyboard.createCursorKeys();
        }

        // --- 4. 操作設定（バーチャルジョイスティック） ---
        // main.ts で登録したプラグインを取得して画面に表示
        // スマホでアクセスしたときだけ表示する判定を入れても良いですが、
        // 開発中はPCでもマウスで動作確認できるので常時表示しておきます
        const joyStickPlugin = this.plugins.get('rexVirtualJoystick') as any;

        if (joyStickPlugin) {
            this.joyStick = joyStickPlugin.add(this, {
                x: 100, // 画面左下あたり
                y: this.cameras.main.height - 100,
                radius: 60,
                base: { fill: 0x888888, alpha: 0.5 },
                thumb: { fill: 0xcccccc, alpha: 0.8 },
                // ジョイスティックがカメラについてくるように固定（ScrollFactor: 0）
            });

            // ここが魔法: ジョイスティックの動きをカーソルキー入力として変換する
            this.joyStickCursors = this.joyStick.createCursorKeys();

            // ジョイスティック自体はUIなのでカメラと一緒に動くよう設定
            // (rexVirtualJoystickの仕様上、作成後にsetScrollFactorが必要な場合があるため念の為)
            // ※描画レイヤーの管理が必要になる場合もありますが、一旦このままで
        }
    }

    update() {
        // プレイヤーの速度をリセット
        const speed = 200;
        const body = this.player.body as Phaser.Physics.Arcade.Body;
        body.setVelocity(0);

        // 入力がない場合は何もしない
        if (!this.cursors && !this.joyStickCursors) return;

        // --- キーボードとジョイスティックの入力を統合 ---
        // 「キーボードが押されている」または「ジョイスティックが倒されている」
        const left = this.cursors.left.isDown || (this.joyStickCursors && this.joyStickCursors.left.isDown);
        const right = this.cursors.right.isDown || (this.joyStickCursors && this.joyStickCursors.right.isDown);
        const up = this.cursors.up.isDown || (this.joyStickCursors && this.joyStickCursors.up.isDown);
        const down = this.cursors.down.isDown || (this.joyStickCursors && this.joyStickCursors.down.isDown);

        // X軸の移動
        if (left) {
            body.setVelocityX(-speed);
            this.player.flipX = true; // 左向きに反転（お好みで）
        } else if (right) {
            body.setVelocityX(speed);
            this.player.flipX = false;
        }

        // Y軸の移動
        if (up) {
            body.setVelocityY(-speed);
        } else if (down) {
            body.setVelocityY(speed);
        }

        // 斜め移動時の速度補正（ピタゴラスの定理で速くなりすぎないように）
        body.velocity.normalize().scale(speed);
    }
}