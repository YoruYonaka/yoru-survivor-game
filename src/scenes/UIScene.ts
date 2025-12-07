import Phaser from 'phaser';

export default class UIScene extends Phaser.Scene {
    private hpBar!: Phaser.GameObjects.Graphics;
    private expBar!: Phaser.GameObjects.Graphics;
    private levelText!: Phaser.GameObjects.Text;
    private scoreText!: Phaser.GameObjects.Text;
    private timerText!: Phaser.GameObjects.Text;

    private _hp: number = 100;
    private _maxHp: number = 100;
    private _exp: number = 0;
    private _msgExp: number = 100; // Next Level Exp
    private _level: number = 1;
    private _score: number = 0;
    private _time: number = 0;

    constructor() {
        super('UIScene');
    }

    create() {
        this.createExpBar();
        this.createHUD();

        // Listen to events from GameScene
        const gameScene = this.scene.get('GameScene');
        gameScene.events.on('updateHP', this.onUpdateHP, this);
        gameScene.events.on('updateEXP', this.onUpdateEXP, this);
        gameScene.events.on('levelUp', this.onLevelUp, this);
        gameScene.events.on('updateScore', this.onUpdateScore, this);

        // Initial updates
        this.updateHPBar();
        this.updateExpBar();
    }

    private createExpBar() {
        const width = this.cameras.main.width;
        // EXP Bar Background (Top edge)
        this.expBar = this.add.graphics();
        this.expBar.setScrollFactor(0);
    }

    private createHUD() {
        const width = this.cameras.main.width;

        // --- Top Left: HP ---
        // Container background for HP
        const hpBg = this.add.graphics();
        hpBg.fillStyle(0x000000, 0.5);
        hpBg.fillRoundedRect(10, 10, 260, 40, 10);

        this.add.text(25, 20, 'HP', {
            fontSize: '20px',
            fontFamily: 'Impact, Arial Black',
            color: '#FF0055', // Neon Red-ish
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0, 0);

        this.hpBar = this.add.graphics();

        // --- Top Center: Timer ---
        // Container
        const timerBg = this.add.graphics();
        timerBg.fillStyle(0x000000, 0.5);
        timerBg.fillRoundedRect(width / 2 - 60, 10, 120, 40, 10);

        this.timerText = this.add.text(width / 2, 30, '00:00', {
            fontSize: '24px',
            fontFamily: 'Consolas, Courier New, monospace',
            color: '#FFFFFF',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);

        // --- Top Right: Stats (Level & Kills) ---
        const statsBg = this.add.graphics();
        statsBg.fillStyle(0x000000, 0.5);
        statsBg.fillRoundedRect(width - 160, 10, 150, 70, 10);

        this.levelText = this.add.text(width - 85, 25, `LV. ${this._level}`, {
            fontSize: '24px',
            fontFamily: 'Impact, Arial Black',
            color: '#FFFF00', // Neon Yellow
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);

        this.scoreText = this.add.text(width - 85, 55, `KILLS: ${this._score}`, {
            fontSize: '16px',
            fontFamily: 'Arial',
            color: '#CCCCCC',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);
    }

    update(time: number, delta: number) {
        this._time += delta;
        const seconds = Math.floor(this._time / 1000);
        const minutes = Math.floor(seconds / 60);
        const partSeconds = seconds % 60;
        this.timerText.setText(`${minutes.toString().padStart(2, '0')}:${partSeconds.toString().padStart(2, '0')}`);
    }

    private onUpdateHP(current: number, max: number) {
        this._hp = current;
        this._maxHp = max;
        this.updateHPBar();
    }

    private updateHPBar() {
        this.hpBar.clear();

        // Layout constants
        const x = 60;
        const y = 22;
        const w = 200;
        const h = 16;

        // Background Track
        this.hpBar.fillStyle(0x330000, 0.8);
        this.hpBar.fillRect(x, y, w, h);

        // HP Fill
        const percent = Phaser.Math.Clamp(this._hp / this._maxHp, 0, 1);
        this.hpBar.fillStyle(0xFF0055, 1); // Neon Red
        this.hpBar.fillRect(x, y, w * percent, h);

        // Border
        this.hpBar.lineStyle(2, 0xFFFFFF, 0.5);
        this.hpBar.strokeRect(x, y, w, h);
    }

    private onUpdateEXP(current: number, nextLevel: number, level: number) {
        this._exp = current || 0;
        this._msgExp = nextLevel || 100;
        this._level = level || 1;

        if (this.levelText) this.levelText.setText(`LV. ${this._level}`);
        this.updateExpBar();
    }

    private updateExpBar() {
        const width = this.cameras.main.width;
        const barHeight = 6;

        this.expBar.clear();

        // BG
        this.expBar.fillStyle(0x000000, 0.8);
        this.expBar.fillRect(0, 0, width, barHeight);

        // Fill
        if (this._msgExp > 0) {
            const percent = Phaser.Math.Clamp(this._exp / this._msgExp, 0, 1);
            this.expBar.fillStyle(0x00FFFF, 1); // Neon Cyan
            this.expBar.fillRect(0, 0, width * percent, barHeight);

            // Glow effect (simulated with lighter overlay or another rect)
            this.expBar.fillStyle(0xFFFFFF, 0.3);
            this.expBar.fillRect(0, 0, width * percent, barHeight / 2); // Top half shine
        }
    }

    private onUpdateScore(score: number) {
        this._score = score;
        if (this.scoreText) this.scoreText.setText(`KILLS: ${this._score}`);
    }

    private onLevelUp() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        const container = this.add.container(width / 2, height / 2);

        // Overlay Background
        const bg = this.add.rectangle(0, 0, 500, 400, 0x000000, 0.9);
        bg.setStrokeStyle(4, 0x00FFFF); // Cyan Border

        const title = this.add.text(0, -150, 'LEVEL UP!', {
            fontSize: '48px',
            fontFamily: 'Impact',
            color: '#FFFF00',
            stroke: '#FF9900',
            strokeThickness: 6
        }).setOrigin(0.5);

        const btn1 = this.createUpgradeButton(0, -50, 'ATTACK SPEED UP', 'Increases attack rate', () => {
            this.confirmUpgrade(container, 'attack');
        });

        const btn2 = this.createUpgradeButton(0, 30, 'MOVEMENT SPEED UP', 'Increases move speed', () => {
            this.confirmUpgrade(container, 'speed');
        });

        const btn3 = this.createUpgradeButton(0, 110, 'HEAL HP', 'Restores 20 HP', () => {
            this.confirmUpgrade(container, 'heal');
        });

        container.add([bg, title, btn1, btn2, btn3]);

        // Simple entrance animation
        container.setScale(0);
        this.tweens.add({
            targets: container,
            scale: 1,
            duration: 300,
            ease: 'Back.out'
        });
    }

    private createUpgradeButton(x: number, y: number, text: string, subText: string, onClick: () => void) {
        const btn = this.add.container(x, y);

        const width = 400;
        const height = 70;

        const bg = this.add.rectangle(0, 0, width, height, 0x222222).setInteractive();
        bg.setStrokeStyle(2, 0x666666);

        const label = this.add.text(0, -10, text, {
            fontSize: '24px',
            fontFamily: 'Impact',
            color: '#FFFFFF'
        }).setOrigin(0.5);

        const subLabel = this.add.text(0, 15, subText, {
            fontSize: '16px',
            fontFamily: 'Arial',
            color: '#AAAAAA'
        }).setOrigin(0.5);

        // Hover Effects
        bg.on('pointerover', () => {
            bg.setFillStyle(0x444444);
            bg.setStrokeStyle(2, 0x00FF00); // Green border on hover
            label.setColor('#00FF00');
        });

        bg.on('pointerout', () => {
            bg.setFillStyle(0x222222);
            bg.setStrokeStyle(2, 0x666666);
            label.setColor('#FFFFFF');
        });

        bg.on('pointerdown', onClick);

        btn.add([bg, label, subLabel]);
        return btn;
    }

    private confirmUpgrade(container: Phaser.GameObjects.Container, type: string) {
        // Exit animation
        this.tweens.add({
            targets: container,
            scale: 0,
            duration: 200,
            onComplete: () => {
                this.scene.get('GameScene').events.emit('selectUpgrade', type);
                container.destroy();
            }
        });
    }
}
