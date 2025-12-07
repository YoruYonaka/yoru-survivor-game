import Phaser from 'phaser';
import DataManager, { type SaveData, type UpgradeType } from '../utils/DataManager';

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
        this.createStartButton();
        this.createUpgradePanel();
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

    private createStartButton() {
        const width = this.cameras.main.width;
        const startContainer = this.add.container(width / 2, 260);

        const buttonBg = this.add.rectangle(0, 0, 260, 64, 0x1d4ed8, 0.9).setInteractive({ useHandCursor: true });
        buttonBg.setStrokeStyle(3, 0x60a5fa);

        const label = this.add.text(0, 0, 'START RUN', {
            fontSize: '28px',
            fontFamily: 'Impact, Arial Black',
            color: '#e0f2fe'
        }).setOrigin(0.5);

        buttonBg.on('pointerover', () => {
            buttonBg.setFillStyle(0x2563eb, 1);
            buttonBg.setStrokeStyle(3, 0x93c5fd);
            label.setColor('#ffffff');
        });

        buttonBg.on('pointerout', () => {
            buttonBg.setFillStyle(0x1d4ed8, 0.9);
            buttonBg.setStrokeStyle(3, 0x60a5fa);
            label.setColor('#e0f2fe');
        });

        buttonBg.on('pointerdown', () => {
            this.scene.start('GameScene');
            this.scene.stop('TitleScene');
        });

        startContainer.add([buttonBg, label]);
    }

    private createUpgradePanel() {
        const width = this.cameras.main.width;
        const panel = this.add.container(width / 2, 440);

        const bg = this.add.rectangle(0, 0, 700, 260, 0x0f172a, 0.7);
        bg.setStrokeStyle(2, 0x334155, 0.9);
        bg.setDepth(-1);

        const title = this.add.text(0, -110, 'POWER UP', {
            fontSize: '32px',
            fontFamily: 'Impact',
            color: '#fbbf24',
            stroke: '#b45309',
            strokeThickness: 4
        }).setOrigin(0.5);

        const upgrades: { key: UpgradeType; title: string; detail: string }[] = [
            { key: 'damage', title: 'Damage Amplifier', detail: '+5 DMG / Lv' },
            { key: 'speed', title: 'Boots of Haste', detail: '+12 SPD / Lv' },
            { key: 'maxHp', title: 'Crystal Heart', detail: '+20 HP / Lv' }
        ];

        const columnSpacing = 220;
        upgrades.forEach((upgrade, index) => {
            const xOffset = -columnSpacing + index * columnSpacing;
            const card = this.createUpgradeCard(xOffset, 0, upgrade.key, upgrade.title, upgrade.detail);
            panel.add(card);
        });

        panel.add([bg, title]);
    }

    private createUpgradeCard(x: number, y: number, type: UpgradeType, title: string, description: string) {
        const container = this.add.container(x, y);
        const cardBg = this.add.rectangle(0, 0, 200, 180, 0x111827, 0.85).setInteractive({ useHandCursor: true });
        cardBg.setStrokeStyle(2, 0x1f2937);
        cardBg.setDepth(-1);

        const label = this.add.text(0, -60, title, {
            fontSize: '18px',
            fontFamily: 'Impact',
            color: '#e5e7eb'
        }).setOrigin(0.5);

        const desc = this.add.text(0, -30, description, {
            fontSize: '14px',
            fontFamily: 'Arial',
            color: '#9ca3af'
        }).setOrigin(0.5);

        const levelText = this.add.text(0, 20, '', {
            fontSize: '16px',
            fontFamily: 'Arial Black',
            color: '#34d399'
        }).setOrigin(0.5);

        const costLabel = this.add.text(0, 50, '', {
            fontSize: '14px',
            fontFamily: 'Arial',
            color: '#fbbf24'
        }).setOrigin(0.5);

        const refreshCard = () => {
            const save = this.dataManager.saveData;
            const level = this.getUpgradeLevel(save, type);
            const nextCost = this.getUpgradeCost(level);
            levelText.setText(`Lv.${level}`);
            costLabel.setText(`Cost: ${nextCost} C`);
        };

        cardBg.on('pointerover', () => {
            cardBg.setStrokeStyle(2, 0x38bdf8);
        });

        cardBg.on('pointerout', () => {
            cardBg.setStrokeStyle(2, 0x1f2937);
        });

        cardBg.on('pointerdown', () => {
            const save = this.dataManager.saveData;
            const level = this.getUpgradeLevel(save, type);
            const cost = this.getUpgradeCost(level);
            const success = this.dataManager.upgrade(type, cost);
            if (success) {
                this.refreshCoins();
                refreshCard();
            } else {
                this.showToast('Not enough coins');
            }
        });

        refreshCard();
        container.add([cardBg, label, desc, levelText, costLabel]);
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

    private getUpgradeLevel(save: SaveData, type: UpgradeType): number {
        switch (type) {
            case 'damage':
                return save.upgradeLevelDamage;
            case 'speed':
                return save.upgradeLevelSpeed;
            case 'maxHp':
                return save.upgradeLevelMaxHP;
        }
    }

    private getUpgradeCost(level: number): number {
        return 50 + level * 25;
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
