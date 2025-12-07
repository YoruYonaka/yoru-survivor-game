import Phaser from 'phaser';
import Projectile from './Projectile';
import { ASSETS } from '../AssetManifest';

type WASDKeys = {
    up: Phaser.Input.Keyboard.Key;
    down: Phaser.Input.Keyboard.Key;
    left: Phaser.Input.Keyboard.Key;
    right: Phaser.Input.Keyboard.Key;
};

export default class Player extends Phaser.Physics.Arcade.Sprite {
    private speed: number = 200;
    private hp: number = 100;
    private maxHp: number = 100;

    // EXP System
    private exp: number = 0;
    private level: number = 1;
    private nextLevelExp: number = 100;

    private attackTimer: number = 0;
    private attackInterval: number = 1000; // 1 second
    private projectiles!: Phaser.Physics.Arcade.Group;
    private enemies!: Phaser.Physics.Arcade.Group;

    private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
    private wasd?: WASDKeys;
    private joyStickCursors?: Phaser.Types.Input.Keyboard.CursorKeys;

    constructor(scene: Phaser.Scene, x: number, y: number, texture: string) {
        super(scene, x, y, texture);

        // Setup physics body
        scene.physics.add.existing(this);
        this.setCollideWorldBounds(true);
        this.setDisplaySize(32, 32);
        this.setCircle(12);
        this.setOffset(4, 4);

        // Initialize Input Keys directly
        if (scene.input.keyboard) {
            this.cursors = scene.input.keyboard.createCursorKeys();
            this.wasd = scene.input.keyboard.addKeys({
                up: Phaser.Input.Keyboard.KeyCodes.W,
                down: Phaser.Input.Keyboard.KeyCodes.S,
                left: Phaser.Input.Keyboard.KeyCodes.A,
                right: Phaser.Input.Keyboard.KeyCodes.D
            }) as unknown as WASDKeys;
        }
    }

    setEnemies(enemies: Phaser.Physics.Arcade.Group) {
        this.enemies = enemies;
    }

    setProjectiles(projectiles: Phaser.Physics.Arcade.Group) {
        this.projectiles = projectiles;
    }

    setJoystick(joyStickCursors: Phaser.Types.Input.Keyboard.CursorKeys) {
        this.joyStickCursors = joyStickCursors;
    }

    update(time: number, delta: number) {
        this.handleMovement();
        this.handleAttack(time, delta);
    }

    private handleMovement() {
        if (!this.body) return;

        const body = this.body as Phaser.Physics.Arcade.Body;
        body.setVelocity(0);

        // Check arrow keys
        const leftArrow = this.cursors?.left.isDown || false;
        const rightArrow = this.cursors?.right.isDown || false;
        const upArrow = this.cursors?.up.isDown || false;
        const downArrow = this.cursors?.down.isDown || false;

        const leftWASD = this.wasd?.left.isDown || false;
        const rightWASD = this.wasd?.right.isDown || false;
        const upWASD = this.wasd?.up.isDown || false;
        const downWASD = this.wasd?.down.isDown || false;

        // Check Joystick
        const leftJoy = this.joyStickCursors?.left.isDown || false;
        const rightJoy = this.joyStickCursors?.right.isDown || false;
        const upJoy = this.joyStickCursors?.up.isDown || false;
        const downJoy = this.joyStickCursors?.down.isDown || false;

        const left = leftArrow || leftWASD || leftJoy;
        const right = rightArrow || rightWASD || rightJoy;
        const up = upArrow || upWASD || upJoy;
        const down = downArrow || downWASD || downJoy;

        if (left) {
            body.setVelocityX(-this.speed);
            this.setFlipX(true);
        } else if (right) {
            body.setVelocityX(this.speed);
            this.setFlipX(false);
        }

        if (up) {
            body.setVelocityY(-this.speed);
        } else if (down) {
            body.setVelocityY(this.speed);
        }

        body.velocity.normalize().scale(this.speed);
    }

    private handleAttack(time: number, delta: number) {
        this.attackTimer += delta;

        if (this.attackTimer >= this.attackInterval) {
            this.attackTimer = 0;
            this.fireProjectile();
        }
    }

    private fireProjectile() {
        if (!this.enemies || !this.projectiles) return;

        // Find nearest enemy
        let nearestEnemy: Phaser.Physics.Arcade.Sprite | null = null;
        let minDistance = Infinity;

        this.enemies.getChildren().forEach((child) => {
            const enemy = child as Phaser.Physics.Arcade.Sprite;
            if (!enemy.active) return; // Ignore dead enemies

            const distance = Phaser.Math.Distance.Between(this.x, this.y, enemy.x, enemy.y);
            if (distance < minDistance) {
                minDistance = distance;
                nearestEnemy = enemy;
            }
        });

        if (nearestEnemy) {
            // Get a projectile from the group
            const projectile = this.projectiles.get(this.x, this.y, ASSETS.BULLET.key) as Projectile | null;
            if (projectile instanceof Projectile) {
                projectile.fire(this.x, this.y, nearestEnemy.x, nearestEnemy.y);
            }
        }
    }

    gainExp(amount: number) {
        console.log(`gainExp called: ${amount}, current: ${this.exp}`);
        this.exp += amount;

        // Emit event to UI
        if (this.scene) {
            this.scene.events.emit('updateEXP', this.exp, this.nextLevelExp, this.level);
        }

        if (this.exp >= this.nextLevelExp) {
            this.levelUp();
        }
    }

    private levelUp() {
        this.level++;
        this.exp -= this.nextLevelExp;
        this.nextLevelExp = Math.floor(this.nextLevelExp * 1.5);

        // Update UI again
        this.scene.events.emit('updateEXP', this.exp, this.nextLevelExp, this.level);

        // Trigger Level Up Event (pauses game in GameScene)
        this.scene.events.emit('levelUp');
    }

    upgradeStat(type: string) {
        switch (type) {
            case 'attack':
                this.attackInterval = Math.max(100, this.attackInterval - 100);
                console.log(`Upgraded Attack Speed: ${this.attackInterval}`);
                break;
            case 'speed':
                this.speed += 20;
                console.log(`Upgraded Speed: ${this.speed}`);
                break;
            case 'heal':
                this.hp = Math.min(this.hp + 20, this.maxHp);
                this.scene.events.emit('updateHP', this.hp, this.maxHp);
                console.log(`Healed: ${this.hp}`);
                break;
        }
    }

    takeDamage(amount: number) {
        if (!this.active) return;
        this.hp -= amount;
        this.scene.events.emit('updateHP', this.hp, this.maxHp);
        console.log(`Player HP: ${this.hp}`);
        if (this.hp <= 0) {
            // Die
            this.setTint(0xff0000);
            this.scene.physics.pause();
            console.log("GAME OVER");
        }
    }
}
