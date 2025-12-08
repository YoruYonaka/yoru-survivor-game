import Phaser from 'phaser';

interface DamagePopupStyle {
    readonly color?: string;
    readonly stroke?: string;
    readonly fontSize?: string;
}

export default class DamagePopup extends Phaser.GameObjects.Text {
    private constructor(scene: Phaser.Scene, x: number, y: number, damage: number, style?: DamagePopupStyle) {
        super(scene, x, y, damage.toString(), {
            fontFamily: 'Impact, Arial Black',
            fontSize: style?.fontSize ?? '22px',
            color: style?.color ?? '#ffe8a3',
            stroke: style?.stroke ?? '#ff6b6b',
            strokeThickness: 4,
            shadow: {
                offsetX: 0,
                offsetY: 0,
                color: '#111111',
                blur: 4,
                fill: true
            },
        });

        this.setOrigin(0.5);
        this.setScale(0.9 + Math.random() * 0.2);
        this.setDepth(1000);
    }

    static spawn(scene: Phaser.Scene, x: number, y: number, damage: number) {
        const popup = new DamagePopup(scene, x, y, damage);
        scene.add.existing(popup);

        scene.tweens.add({
            targets: popup,
            y: y - 28,
            alpha: 0,
            scale: 1.15,
            duration: 450,
            ease: 'Cubic.easeOut',
            onComplete: () => popup.destroy(),
        });
    }
}
