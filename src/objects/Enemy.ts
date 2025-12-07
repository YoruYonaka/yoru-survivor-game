import Phaser from 'phaser';
import Player from './Player';

export default class Enemy extends Phaser.Physics.Arcade.Sprite {
    private target: Player | null = null;
    private speed: number = 80;

    constructor(scene: Phaser.Scene, x: number, y: number, texture: string) {
        super(scene, x, y, texture);
    }

    setTarget(target: Player) {
        this.target = target;
    }

    preUpdate(time: number, delta: number) {
        super.preUpdate(time, delta);

        if (this.target && this.target.active) {
            this.scene.physics.moveToObject(this, this.target, this.speed);
        } else {
            this.setVelocity(0);
        }
    }
}
