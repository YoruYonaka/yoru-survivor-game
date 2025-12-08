import Phaser from 'phaser';

export type UpgradeType = 'attack' | 'speed' | 'heal';

interface PowerUpSceneData {
    onSelectUpgrade: (type: UpgradeType) => void;
    onReturnToTitle: () => void;
}

export default class PowerUpScene extends Phaser.Scene {
    constructor() {
        super('PowerUpScene');
    }

    create(data: PowerUpSceneData) {
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

        const options: { type: UpgradeType; title: string; desc: string }[] = [
            { type: 'attack', title: 'Rapid Fire', desc: 'Shoot faster and hit harder' },
            { type: 'speed', title: 'Phantom Dash', desc: 'Greatly boost your movement speed' },
            { type: 'heal', title: 'Starlit Heal', desc: 'Restore a chunk of your vitality' },
        ];

        const spacing = 250;
        options.forEach((opt, index) => {
            const card = this.createOptionCard(width / 2 - spacing + spacing * index, height / 2 + 40, opt, data.onSelectUpgrade);
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
            data.onReturnToTitle();
        });

        this.add.existing(panel);
        this.add.existing(title);
        this.add.existing(sub);
        this.add.existing(titleButton);
    }

    private createOptionCard(x: number, y: number, option: { type: UpgradeType; title: string; desc: string }, onSelect: (type: UpgradeType) => void) {
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
}
