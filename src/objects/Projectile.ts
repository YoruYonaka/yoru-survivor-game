import Phaser from 'phaser';

export default class Projectile extends Phaser.Physics.Arcade.Sprite {
    private speed: number = 400;
    private lifespan: number = 2000; // 2 seconds

    constructor(scene: Phaser.Scene, x: number, y: number, texture: string) {
        super(scene, x, y, texture);
        // Do not add to scene via 'new', the group will handle it or we add it manually if not using group.create
        // But usually for pool we use group.get().
        // Here we assume standard new instantiation or group usage.
    }

    fire(x: number, y: number, targetX: number, targetY: number) {
        this.setPosition(x, y);
        this.setActive(true);
        this.setVisible(true);

        const angle = Phaser.Math.Angle.Between(x, y, targetX, targetY);
        this.setRotation(angle);

        this.scene.physics.velocityFromRotation(angle, this.speed, this.body!.velocity);

        this.lifespan = 2000;
    }

    preUpdate(time: number, delta: number) {
        super.preUpdate(time, delta);

        this.lifespan -= delta;
        if (this.lifespan <= 0) {
            this.setActive(false);
            this.setVisible(false);
            this.body!.stop();
        }
    }
}
