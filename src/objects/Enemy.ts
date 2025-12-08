import Phaser from 'phaser';
import Player from './Player';

export default class Enemy extends Phaser.Physics.Arcade.Sprite {
    private target: Player | null = null;
    private speed: number = 80;
    private hp: number = 30;
    private maxHp: number = 30;

    constructor(scene: Phaser.Scene, x: number, y: number, texture: string) {
        super(scene, x, y, texture);
    }

    setTarget(target: Player) {
        this.target = target;
    }

    resetState(baseSpeed: number, baseHp: number) {
        this.speed = baseSpeed;
        this.maxHp = baseHp;
        this.hp = this.maxHp;
        this.setActive(true);
        this.setVisible(true);
        if (this.body) {
            const body = this.body as Phaser.Physics.Arcade.Body;
            body.enable = true;
        }
    }

    takeDamage(amount: number): boolean {
        this.hp -= amount;
        if (this.hp <= 0) {
            this.hp = 0;
            return true;
        }
        return false;
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
