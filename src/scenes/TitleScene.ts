import Phaser from 'phaser';
import DataManager from '../utils/DataManager';

interface TitleSceneData {
    coinsEarned?: number;
    killCount?: number;
}

export default class TitleScene extends Phaser.Scene {
    private dataManager = DataManager.instance;
    private coinText?: Phaser.GameObjects.Text;
    private lastResultText?: Phaser.GameObjects.Text;

    constructor() {
        super('TitleScene');
    }

    create(data?: TitleSceneData) {
        this.cameras.main.setBackgroundColor('#0b0c10');
        this.add.rectangle(0, 0, this.cameras.main.width * 2, this.cameras.main.height * 2, 0x0f172a, 0.9)
            .setOrigin(0);

        this.createTitleLogo();
        this.createNavigationButtons();
        this.createCoinDisplay();
        this.createResultToast(data);
    }

    private createTitleLogo() {
        const width = this.cameras.main.width;
        this.add.text(width / 2, 120, 'YORU SURVIVOR', {
            fontSize: '64px',
            fontFamily: 'Impact, "Bebas Neue", Arial Black',
            color: '#38bdf8',
            stroke: '#0ea5e9',
            strokeThickness: 8,
            shadow: {
                offsetX: 0,
                offsetY: 8,
                color: '#020617',
                blur: 8,
                fill: true
            }
        }).setOrigin(0.5);

        this.add.text(width / 2, 180, 'Forge your legacy between runs', {
            fontSize: '20px',
            fontFamily: 'Arial',
            color: '#cbd5e1'
        }).setOrigin(0.5);
    }

    private createNavigationButtons() {
        const width = this.cameras.main.width;
        const buttons = this.add.container(width / 2, 260);

        const startBtn = this.createPrimaryButton(0, 0, 'START RUN', () => {
            this.scene.start('GameScene');
        });

        const powerUpBtn = this.createSecondaryButton(0, 100, 'POWER UP MENU', () => {
            this.scene.start('PowerUpScene', { mode: 'meta' });
        });

        buttons.add([startBtn, powerUpBtn]);
    }

    private createPrimaryButton(x: number, y: number, label: string, onClick: () => void) {
        const container = this.add.container(x, y);
        const buttonBg = this.add.rectangle(0, 0, 280, 68, 0x1d4ed8, 0.95).setInteractive({ useHandCursor: true });
        buttonBg.setStrokeStyle(3, 0x60a5fa);

        const text = this.add.text(0, 0, label, {
            fontSize: '30px',
            fontFamily: 'Impact, Arial Black',
            color: '#e0f2fe'
        }).setOrigin(0.5);

        buttonBg.on('pointerover', () => {
            buttonBg.setFillStyle(0x2563eb, 1);
            text.setColor('#ffffff');
        });

        buttonBg.on('pointerout', () => {
            buttonBg.setFillStyle(0x1d4ed8, 0.95);
            text.setColor('#e0f2fe');
        });

        buttonBg.on('pointerdown', onClick);
        container.add([buttonBg, text]);
        return container;
    }

    private createSecondaryButton(x: number, y: number, label: string, onClick: () => void) {
        const container = this.add.container(x, y);
        const bg = this.add.rectangle(0, 0, 260, 58, 0x1f2937, 0.9).setInteractive({ useHandCursor: true });
        bg.setStrokeStyle(2, 0x38bdf8);

        const text = this.add.text(0, 0, label, {
            fontSize: '22px',
            fontFamily: 'Impact',
            color: '#e2e8f0'
        }).setOrigin(0.5);

        bg.on('pointerover', () => {
            bg.setFillStyle(0x273449, 0.95);
            text.setColor('#ffffff');
        });

        bg.on('pointerout', () => {
            bg.setFillStyle(0x1f2937, 0.9);
            text.setColor('#e2e8f0');
        });

        bg.on('pointerdown', onClick);
        container.add([bg, text]);
        return container;
    }

    private createCoinDisplay() {
        const width = this.cameras.main.width;
        const box = this.add.rectangle(width - 180, 60, 240, 60, 0x111827, 0.75);
        box.setStrokeStyle(2, 0x1f2937);

        const label = this.add.text(width - 270, 60, 'COINS', {
            fontSize: '18px',
            fontFamily: 'Arial Black',
            color: '#fbbf24'
        }).setOrigin(0, 0.5);

        this.coinText = this.add.text(width - 70, 60, '', {
            fontSize: '22px',
            fontFamily: 'Consolas, monospace',
            color: '#e5e7eb'
        }).setOrigin(1, 0.5);

        this.refreshCoins();
    }

    private createResultToast(data?: TitleSceneData) {
        if (!data?.coinsEarned) return;

        const toast = this.add.container(this.cameras.main.width - 200, this.cameras.main.height - 100);
        const bg = this.add.rectangle(0, 0, 260, 90, 0x0f172a, 0.85);
        bg.setStrokeStyle(2, 0x22d3ee);

        const title = this.add.text(0, -20, 'Run Summary', {
            fontSize: '18px',
            fontFamily: 'Arial Black',
            color: '#38bdf8'
        }).setOrigin(0.5);

        const message = this.add.text(0, 10, `+${data.coinsEarned} coins  |  ${data.killCount ?? 0} kills`, {
            fontSize: '14px',
            fontFamily: 'Arial',
            color: '#e5e7eb'
        }).setOrigin(0.5);

        toast.add([bg, title, message]);

        this.tweens.add({
            targets: toast,
            alpha: 0,
            y: '-=20',
            duration: 3000,
            ease: 'Sine.easeOut',
            delay: 5000,
            onComplete: () => toast.destroy()
        });
    }

    private refreshCoins() {
        if (this.coinText) {
            this.coinText.setText(`${this.dataManager.saveData.totalCoins}`);
        }
    }

    private showToast(message: string) {
        if (this.lastResultText) {
            this.lastResultText.destroy();
        }
        this.lastResultText = this.add.text(this.cameras.main.width / 2, this.cameras.main.height - 40, message, {
            fontSize: '16px',
            fontFamily: 'Arial Black',
            color: '#f87171',
            backgroundColor: '#0f172acc',
            padding: { left: 12, right: 12, top: 6, bottom: 6 }
        }).setOrigin(0.5);

        this.tweens.add({
            targets: this.lastResultText,
            alpha: 0,
            duration: 1800,
            ease: 'Sine.easeOut',
            onComplete: () => this.lastResultText?.destroy()
        });
    }
}
