import Phaser from 'phaser';
import DataManager, { type SaveData, type UpgradeType as MetaUpgradeType } from '../utils/DataManager';

export type RunUpgradeType = 'attack' | 'speed' | 'heal';
export type PowerUpSceneMode = 'meta' | 'levelUp';

interface PowerUpSceneData {
    mode?: PowerUpSceneMode;
    onSelectUpgrade?: (type: RunUpgradeType) => void;
    onReturnToTitle?: () => void;
}

export default class PowerUpScene extends Phaser.Scene {
    private readonly dataManager = DataManager.instance;
    private coinText?: Phaser.GameObjects.Text;
    private lastResultText?: Phaser.GameObjects.Text;

    constructor() {
        super('PowerUpScene');
    }

    create(data: PowerUpSceneData) {
        const mode: PowerUpSceneMode = data?.mode ?? 'levelUp';

        if (mode === 'meta') {
            this.createMetaPowerUpScreen();
            return;
        }

        this.createLevelUpOverlay(data);
    }

    private createLevelUpOverlay(data: PowerUpSceneData) {
        this.input.topOnly = true;
        this.scene.bringToTop();
        this.cameras.main.setBackgroundColor('#0b0c10');

        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        const backdrop = this.add.rectangle(width / 2, height / 2, width, height, 0x020617, 1);
        backdrop.setOrigin(0.5);
        backdrop.setInteractive();

        const panel = this.add.rectangle(width / 2, height / 2, 760, 480, 0x0f172a, 1);
        panel.setStrokeStyle(3, 0x38bdf8);

        const title = this.add.text(width / 2, height / 2 - 200, 'POWER UP!', {
            fontSize: '48px',
            fontFamily: 'Impact',
            color: '#fbbf24',
            stroke: '#b45309',
            strokeThickness: 6,
            shadow: {
                offsetX: 0,
                offsetY: 6,
                color: '#020617',
                blur: 8,
                fill: true,
            },
        }).setOrigin(0.5);

        const sub = this.add.text(width / 2, height / 2 - 150, 'Choose one blessing to continue your run', {
            fontSize: '20px',
            fontFamily: 'Arial',
            color: '#e2e8f0',
        }).setOrigin(0.5);

        const options: { type: RunUpgradeType; title: string; desc: string }[] = [
            { type: 'attack', title: 'Rapid Fire', desc: 'Shoot faster and hit harder' },
            { type: 'speed', title: 'Phantom Dash', desc: 'Greatly boost your movement speed' },
            { type: 'heal', title: 'Starlit Heal', desc: 'Restore a chunk of your vitality' },
        ];

        const spacing = 250;
        options.forEach((opt, index) => {
            const card = this.createRunOptionCard(width / 2 - spacing + spacing * index, height / 2 + 40, opt, data.onSelectUpgrade!);
            card.setAlpha(0);
            this.tweens.add({
                targets: card,
                alpha: 1,
                y: '-=8',
                duration: 250,
                ease: 'Quad.easeOut',
                delay: 80 * index,
            });
        });

        const titleButton = this.createSecondaryButton(width / 2, height - 80, 'RETURN TO TITLE', () => {
            data.onReturnToTitle?.();
        });

        this.add.existing(panel);
        this.add.existing(title);
        this.add.existing(sub);
        this.add.existing(titleButton);
    }

    private createRunOptionCard(x: number, y: number, option: { type: RunUpgradeType; title: string; desc: string }, onSelect: (type: RunUpgradeType) => void) {
        const container = this.add.container(x, y);

        const card = this.add.rectangle(0, 0, 220, 260, 0x111827, 0.92).setInteractive({ useHandCursor: true });
        card.setStrokeStyle(2, 0x334155);

        const header = this.add.rectangle(0, -100, 180, 36, 0x1d4ed8, 0.9);
        header.setStrokeStyle(2, 0x60a5fa);

        const title = this.add.text(0, -100, option.title, {
            fontSize: '18px',
            fontFamily: 'Impact',
            color: '#e0f2fe',
        }).setOrigin(0.5);

        const description = this.add.text(0, -30, option.desc, {
            fontSize: '15px',
            fontFamily: 'Arial',
            color: '#cbd5e1',
            wordWrap: { width: 180, useAdvancedWrap: true },
            align: 'center',
        }).setOrigin(0.5);

        const selectButton = this.createSecondaryButton(0, 80, 'CHOOSE', () => onSelect(option.type));

        card.on('pointerover', () => {
            card.setStrokeStyle(2, 0x38bdf8);
            card.setFillStyle(0x0f172a, 0.98);
        });

        card.on('pointerout', () => {
            card.setStrokeStyle(2, 0x334155);
            card.setFillStyle(0x111827, 0.92);
        });

        container.add([card, header, title, description, selectButton]);
        return container;
    }

    private createSecondaryButton(x: number, y: number, label: string, onClick: () => void) {
        const button = this.add.container(x, y);
        const bg = this.add.rectangle(0, 0, 220, 48, 0x1f2937, 0.95).setInteractive({ useHandCursor: true });
        bg.setStrokeStyle(2, 0x38bdf8);

        const text = this.add.text(0, 0, label, {
            fontSize: '18px',
            fontFamily: 'Impact',
            color: '#e2e8f0',
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

        button.add([bg, text]);
        return button;
    }

    private createMetaPowerUpScreen() {
        this.cameras.main.setBackgroundColor('#0b0c10');
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        this.add.rectangle(0, 0, width * 2, height * 2, 0x0f172a, 0.9).setOrigin(0);

        this.add.text(width / 2, 120, 'POWER UP LAB', {
            fontSize: '58px',
            fontFamily: 'Impact',
            color: '#fbbf24',
            stroke: '#b45309',
            strokeThickness: 6,
            shadow: { offsetX: 0, offsetY: 8, color: '#020617', blur: 8, fill: true },
        }).setOrigin(0.5);

        this.createUpgradePanel();
        this.createCoinDisplay();
        this.createMetaNavigation();
    }

    private createUpgradePanel() {
        const width = this.cameras.main.width;
        const panel = this.add.container(width / 2, 420);

        const bg = this.add.rectangle(0, 0, 760, 280, 0x0f172a, 0.7);
        bg.setStrokeStyle(2, 0x334155, 0.9);
        bg.setDepth(-1);

        const title = this.add.text(0, -120, 'Permanent Upgrades', {
            fontSize: '30px',
            fontFamily: 'Impact',
            color: '#38bdf8',
            stroke: '#0ea5e9',
            strokeThickness: 4,
        }).setOrigin(0.5);

        const upgrades: { key: MetaUpgradeType; title: string; detail: string }[] = [
            { key: 'damage', title: 'Damage Amplifier', detail: '+5 DMG / Lv' },
            { key: 'speed', title: 'Boots of Haste', detail: '+12 SPD / Lv' },
            { key: 'maxHp', title: 'Crystal Heart', detail: '+20 HP / Lv' },
        ];

        const columnSpacing = 240;
        upgrades.forEach((upgrade, index) => {
            const xOffset = -columnSpacing + index * columnSpacing;
            const card = this.createMetaUpgradeCard(xOffset, 0, upgrade.key, upgrade.title, upgrade.detail);
            panel.add(card);
        });

        panel.add([bg, title]);
    }

    private createMetaUpgradeCard(x: number, y: number, type: MetaUpgradeType, title: string, description: string) {
        const container = this.add.container(x, y);
        const cardBg = this.add.rectangle(0, 0, 220, 190, 0x111827, 0.85).setInteractive({ useHandCursor: true });
        cardBg.setStrokeStyle(2, 0x1f2937);
        cardBg.setDepth(-1);

        const label = this.add.text(0, -60, title, {
            fontSize: '18px',
            fontFamily: 'Impact',
            color: '#e5e7eb',
        }).setOrigin(0.5);

        const desc = this.add.text(0, -30, description, {
            fontSize: '14px',
            fontFamily: 'Arial',
            color: '#9ca3af',
        }).setOrigin(0.5);

        const levelText = this.add.text(0, 20, '', {
            fontSize: '16px',
            fontFamily: 'Arial Black',
            color: '#34d399',
        }).setOrigin(0.5);

        const costLabel = this.add.text(0, 50, '', {
            fontSize: '14px',
            fontFamily: 'Arial',
            color: '#fbbf24',
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

    private createMetaNavigation() {
        const width = this.cameras.main.width;
        const buttons = this.add.container(width / 2, this.cameras.main.height - 100);

        const backBtn = this.createSecondaryButton(-150, 0, 'BACK TO TITLE', () => {
            this.scene.start('TitleScene');
        });

        const startBtn = this.createSecondaryButton(150, 0, 'START RUN', () => {
            this.scene.start('GameScene');
        });

        buttons.add([backBtn, startBtn]);
    }

    private createCoinDisplay() {
        const width = this.cameras.main.width;
        const box = this.add.rectangle(width - 200, 60, 260, 64, 0x111827, 0.75);
        box.setStrokeStyle(2, 0x1f2937);

        const label = this.add.text(width - 310, 60, 'COINS', {
            fontSize: '18px',
            fontFamily: 'Arial Black',
            color: '#fbbf24',
        }).setOrigin(0, 0.5);

        this.coinText = this.add.text(width - 60, 60, '', {
            fontSize: '22px',
            fontFamily: 'Consolas, monospace',
            color: '#e5e7eb',
        }).setOrigin(1, 0.5);

        this.refreshCoins();
    }

    private getUpgradeLevel(save: SaveData, type: MetaUpgradeType): number {
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
            padding: { left: 12, right: 12, top: 6, bottom: 6 },
        }).setOrigin(0.5);

        this.tweens.add({
            targets: this.lastResultText,
            alpha: 0,
            duration: 1800,
            ease: 'Sine.easeOut',
            onComplete: () => this.lastResultText?.destroy(),
        });
    }
}
