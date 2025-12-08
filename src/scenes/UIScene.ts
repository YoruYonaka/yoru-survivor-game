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
    private isGamePaused: boolean = false;
    private pauseOverlay?: Phaser.GameObjects.Container;

    constructor() {
        super('UIScene');
    }

    create() {
        // Reset pause state and overlay every time the scene starts
        this.isGamePaused = false;
        if (this.pauseOverlay) {
            this.pauseOverlay.destroy();
            this.pauseOverlay = undefined;
        }

        this.createExpBar();
        this.createHUD();
        this.createPauseButton();

        // Listen to events from GameScene
        const gameScene = this.scene.get('GameScene');
        gameScene.events.off('updateHP', this.onUpdateHP, this);
        gameScene.events.off('updateEXP', this.onUpdateEXP, this);
        gameScene.events.off('updateScore', this.onUpdateScore, this);
        gameScene.events.off('pauseStateChanged', this.onPauseStateChanged, this);
        gameScene.events.on('updateHP', this.onUpdateHP, this);
        gameScene.events.on('updateEXP', this.onUpdateEXP, this);
        gameScene.events.on('updateScore', this.onUpdateScore, this);
        gameScene.events.on('pauseStateChanged', this.onPauseStateChanged, this);

        this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
            gameScene.events.off('updateHP', this.onUpdateHP, this);
            gameScene.events.off('updateEXP', this.onUpdateEXP, this);
            gameScene.events.off('updateScore', this.onUpdateScore, this);
            gameScene.events.off('pauseStateChanged', this.onPauseStateChanged, this);
            if (this.pauseOverlay) {
                this.pauseOverlay.destroy();
                this.pauseOverlay = undefined;
            }
            this.isGamePaused = false;
        });

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
        if (this.isGamePaused) return;
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

    private createPauseButton() {
        const buttonContainer = this.add.container(300, 30);
        buttonContainer.setScrollFactor(0);

        const bg = this.add.rectangle(0, 0, 90, 36, 0x0f172a, 0.8).setInteractive({ useHandCursor: true });
        bg.setStrokeStyle(2, 0x38bdf8);

        const label = this.add.text(0, 0, 'PAUSE', {
            fontSize: '18px',
            fontFamily: 'Impact',
            color: '#e2e8f0'
        }).setOrigin(0.5);

        bg.on('pointerover', () => {
            bg.setFillStyle(0x1e293b, 0.95);
            label.setColor('#ffffff');
        });

        bg.on('pointerout', () => {
            bg.setFillStyle(0x0f172a, 0.8);
            label.setColor('#e2e8f0');
        });

        bg.on('pointerdown', () => {
            this.showPauseOverlay();
            this.scene.get('GameScene').events.emit('requestPause');
        });

        buttonContainer.add([bg, label]);
    }

    private showPauseOverlay() {
        if (!this.pauseOverlay) {
            const width = this.cameras.main.width;
            const height = this.cameras.main.height;
            this.pauseOverlay = this.add.container(width / 2, height / 2);
            this.pauseOverlay.setScrollFactor(0);

            const dim = this.add.rectangle(0, 0, width, height, 0x0b1220, 0.85);
            dim.setOrigin(0.5);

            const panel = this.add.rectangle(0, 0, 420, 260, 0x0f172a, 0.95);
            panel.setStrokeStyle(3, 0x38bdf8);

            const title = this.add.text(0, -80, 'PAUSED', {
                fontSize: '36px',
                fontFamily: 'Impact',
                color: '#38bdf8',
                stroke: '#0ea5e9',
                strokeThickness: 4
            }).setOrigin(0.5);

            const resumeBtn = this.createOverlayButton(0, 0, 'RESUME', () => {
                this.hidePauseOverlay();
                this.scene.get('GameScene').events.emit('requestResume');
            });

            const exitBtn = this.createOverlayButton(0, 70, 'RETURN TO TITLE', () => {
                this.hidePauseOverlay();
                this.scene.get('GameScene').events.emit('requestExitToTitle');
            });

            this.pauseOverlay.add([dim, panel, title, resumeBtn, exitBtn]);
        }

        this.pauseOverlay.setVisible(true);
        this.isGamePaused = true;
    }

    private hidePauseOverlay() {
        if (this.pauseOverlay) {
            this.pauseOverlay.setVisible(false);
        }
        this.isGamePaused = false;
    }

    private createOverlayButton(x: number, y: number, label: string, onClick: () => void) {
        const container = this.add.container(x, y);

        const bg = this.add.rectangle(0, 0, 260, 48, 0x1f2937, 0.95).setInteractive({ useHandCursor: true });
        bg.setStrokeStyle(2, 0x38bdf8);

        const text = this.add.text(0, 0, label, {
            fontSize: '20px',
            fontFamily: 'Impact',
            color: '#e2e8f0'
        }).setOrigin(0.5);

        bg.on('pointerover', () => {
            bg.setFillStyle(0x273449, 0.95);
            text.setColor('#ffffff');
        });

        bg.on('pointerout', () => {
            bg.setFillStyle(0x1f2937, 0.95);
            text.setColor('#e2e8f0');
        });

        bg.on('pointerdown', onClick);

        container.add([bg, text]);
        return container;
    }

    private onPauseStateChanged(isPaused: boolean) {
        this.isGamePaused = isPaused;
        if (!isPaused && this.pauseOverlay && this.pauseOverlay.visible) {
            this.hidePauseOverlay();
        }
    }
}
