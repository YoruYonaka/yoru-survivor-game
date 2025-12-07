# Vampire Survivors-like Game Development Roadmap

このドキュメントは、Phaser 3 + TypeScript + Vite を使用した「ヴァンパイアサバイバーライク」なゲームの開発ロードマップです。
開発は以下のStep順に進めてください。各Stepは「動く状態」を維持しながら実装します。

## プロジェクトの基本方針
- **Framework:** Phaser 3, Vite, TypeScript
- **Physics:** Arcade Physics
- **Asset Management:** `src/AssetManifest.ts` を使用して一元管理する。
- **UI Design:** 視認性が高く、モダンでスタイリッシュなデザイン（ネオンカラー、半透明の黒背景など）を意識する。
- **Scalability:** 将来的な機能追加（武器追加、キャラ追加）に耐えられるクラス設計を行う。

---

## Step 1: コアゲームループの構築 (The Prototype)
**目標:** プレイヤーが動き、敵が迫り、自動攻撃で敵を倒せる状態にする。

1.  **Player Class (`src/objects/Player.ts`):**
    -   `Physics.Arcade.Sprite` を継承。
    -   WASD/矢印キーおよび `rexVirtualJoystick` による移動。
    -   **Auto-Attack:** 一定間隔（例: 1秒）で一番近い敵に向かって弾（Projectile）を発射するメソッドを実装。
    -   HP管理機能。
2.  **Enemy Class (`src/objects/Enemy.ts`):**
    -   `Physics.Arcade.Sprite` を継承。
    -   プレイヤーの位置を常に追跡して移動するロジック。
    -   プレイヤーに接触したらダメージを与える。
3.  **Projectile Class (`src/objects/Projectile.ts`):**
    -   敵に当たったら敵を消滅（disable）させる。
4.  **MainScene Integration:**
    -   敵のスポーナー（画面外から一定間隔で生成）を実装。
    -   プレイヤー、敵、弾の物理衝突（Overlap/Collider）を設定。

**Checking:**
- ブラウザで起動し、自機が動き、迫ってくる敵を自動攻撃で倒せること。

---

## Step 2: ゲームサイクルとEXPシステムの実装
**目標:** 敵を倒して経験値を拾い、レベルアップするサイクルを作る。UIを追加する。

1.  **Experience Gem (`src/objects/ExpGem.ts`):**
    -   敵が倒れた場所にドロップする。
    -   プレイヤーが近づくと吸い寄せられる（Magnet効果）。
2.  **UI Overlay (`src/scenes/UIScene.ts`):**
    -   `GameScene` の上に重ねて表示。
    -   **HP Bar:** 現在のHP/MaxHPを視覚的に表示（スタイリッシュなゲージ）。
    -   **EXP Bar:** 画面上部または下部に配置。レベルアップ進捗を表示。
    -   **Kill Count / Timer:** 画面隅に見やすく配置。
3.  **Level Up Logic:**
    -   一定EXP取得でレベルアップ。
    -   レベルアップ時にゲームを一時停止し、ランダムな3つの選択肢（攻撃力UP、速度UPなど）を提示する「アップグレード選択画面」を仮実装（テキストのみでも可）。

**Checking:**
- 敵を倒すとGemが出る。拾うとゲージが増える。レベルアップで一時停止する。UIが見やすいこと。

---

## Step 3: データ永続化とタイトル画面 (Meta Progression)
**目標:** ゲームオーバー後にタイトルに戻り、獲得したコイン等で恒久的な強化を行えるようにする。

1.  **DataManager (`src/utils/DataManager.ts`):**
    -   `localStorage` を使用してデータを保存・読み込みするシングルトン。
    -   保存データ: `totalCoins`, `upradeLevel_Damage`, `upgradeLevel_Speed`, `upgradeLevel_MaxHP`.
2.  **Title Scene (`src/scenes/TitleScene.ts`):**
    -   おしゃれなタイトルロゴと「START」ボタン。
    -   **Upgrade Menu:**
        -   「SHOP」または「POWER UP」ボタンを配置。
        -   現在のコイン所持数を表示。
        -   「攻撃力強化」「移動速度強化」などのボタンを配置し、コインを消費してステータスを上げるUIを作成。
3.  **Game Integration:**
    -   ゲーム開始時、`DataManager` から強化レベルを読み込み、プレイヤーの初期ステータス（攻撃力、HPなど）に反映させる。
    -   ゲームオーバー時に獲得したコイン（またはスコア）を保存する。

**Checking:**
- タイトルで攻撃力を強化してゲームを開始すると、最初から強い状態で始められること。ブラウザをリロードしても強化状況が残っていること。

---

## Step 4: ビジュアルと演出の強化 (Juice & Polish)
**目標:** 「作っていて楽しい」「配信映えする」演出を追加する。

1.  **Damage Popup:**
    -   敵に攻撃が当たった際、ダメージ数値をポップアップ表示（`phaser3-rex-plugins`推奨、なければTweenで実装）。
2.  **Visual Effects:**
    -   敵死亡時のパーティクルエフェクト。
    -   プレイヤー被弾時の点滅（Flash）と画面振動（Camera Shake）。
3.  **Sprite Management:**
    -   `AssetManifest` に登録された画像がなければ、自動的に色付きの図形（Graphics）で代用するフォールバック機能の確認と強化。

---

## 開発時の注意点 (AIへの指示)
- コードを生成する際は、**既存のファイル構成を壊さない**ように注意してください。
- 新しいクラスを作る際は、必ず `export default` し、適切なフォルダに配置してください。
- `any` 型の使用は極力避け、Interfaceを定義してください。
- UIを作成する際は、単なるテキスト配置ではなく、背景に角丸の矩形を敷くなど、**視認性とデザイン**を考慮してください。