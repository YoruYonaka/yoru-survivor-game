import Phaser from 'phaser';

export default class ExpGem extends Phaser.Physics.Arcade.Sprite {
    private expValue: number = 10;
    private isMagnetized: boolean = false;
    private magnetSpeed: number = 400;
    private target: Phaser.Physics.Arcade.Sprite | null = null;

    constructor(scene: Phaser.Scene, x: number, y: number, texture: string) {
        super(scene, x, y, texture);
        // Default physics setup done by group usually, but if independent:
        // scene.physics.add.existing(this);
    }

    resetState(expValue: number = this.expValue, enableBody: boolean = true) {
        this.expValue = expValue;
        this.isMagnetized = false;
        this.target = null;

        if (this.body) {
            const body = this.body as Phaser.Physics.Arcade.Body;
            body.stop();
            body.enable = enableBody;
            body.setCircle(10, 6, 6);
        }
    }

    startMagnet(target: Phaser.Physics.Arcade.Sprite) {
        this.isMagnetized = true;
        this.target = target;
    }

    preUpdate(time: number, delta: number) {
        super.preUpdate(time, delta);

        if (this.isMagnetized && this.target && this.target.active) {
            this.scene.physics.moveToObject(this, this.target, this.magnetSpeed);

            // Optional: Accelerate as it gets closer?
            // For now linear speed is fine.
        }
    }

    getExpValue(): number {
        return this.expValue;
    }
}
