import Phaser from 'phaser';
import { ASSETS } from '../AssetManifest';
import Player from '../objects/Player';
import Enemy from '../objects/Enemy';
import Projectile from '../objects/Projectile';
import ExpGem from '../objects/ExpGem';
import UIScene from './UIScene';
import DataManager from '../utils/DataManager';

interface VirtualJoystick {
    createCursorKeys(): Phaser.Types.Input.Keyboard.CursorKeys;
}

interface VirtualJoystickConfig {
    x: number;
    y: number;
    radius: number;
    base: { fill: number; alpha: number };
    thumb: { fill: number; alpha: number };
}

interface VirtualJoystickPlugin {
    add(scene: Phaser.Scene, config: VirtualJoystickConfig): VirtualJoystick;
}

export default class GameScene extends Phaser.Scene {
    private player!: Player;
    private enemies!: Phaser.Physics.Arcade.Group;
    private projectiles!: Phaser.Physics.Arcade.Group;
    private expGems!: Phaser.Physics.Arcade.Group;
    private killCount: number = 0;
    private readonly dataManager = DataManager.instance;

    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    private joyStickCursors?: Phaser.Types.Input.Keyboard.CursorKeys;
    private joyStick?: VirtualJoystick;

    private isPaused: boolean = false;

    constructor() {
        super('GameScene');
    }

    preload() {
        Object.values(ASSETS).forEach((asset) => {
            this.load.image(asset.key, asset.path);
        });

        this.load.on(Phaser.Loader.Events.FILE_LOAD_ERROR, (file: Phaser.Loader.File) => {
            // We will generate textures in create() to ensure specific shapes
            console.warn(`Details: ${file.key} failed to load.`);
        });
    }

    create() {
        this.isPaused = false;
        this.killCount = 0;
        this.createGameTextures();

        // Background
        this.cameras.main.setBackgroundColor('#e0e0e0'); // Light Gray
        const worldWidth = 2000;
        const worldHeight = 2000;
        this.add.tileSprite(worldWidth / 2, worldHeight / 2, worldWidth, worldHeight, 'background_grid');

        // Launch UI Scene
        this.scene.launch('UIScene');
        this.scene.bringToTop('UIScene');

        // Groups
        this.enemies = this.physics.add.group({
            classType: Enemy,
            runChildUpdate: true
        });

        this.projectiles = this.physics.add.group({
            classType: Projectile,
            runChildUpdate: true
        });

        this.expGems = this.physics.add.group({
            classType: ExpGem,
            runChildUpdate: true
        });

        // Player
        const metaStats = this.dataManager.getPlayerMetaStats();
        this.player = new Player(this, this.cameras.main.width / 2, this.cameras.main.height / 2, ASSETS.PLAYER.key, metaStats);
        this.add.existing(this.player);
        this.player.setEnemies(this.enemies);
        this.player.setProjectiles(this.projectiles);

        this.events.emit('updateHP', this.player.getHp(), this.player.getMaxHp());
        this.events.emit('updateEXP', this.player.getExp(), this.player.getNextLevelExp(), this.player.getLevel());

        // Camera
        this.cameras.main.startFollow(this.player);
        this.cameras.main.setBounds(0, 0, worldWidth, worldHeight);
        this.physics.world.setBounds(0, 0, worldWidth, worldHeight);

        // Inputs
        const joyStickPlugin = this.plugins.get('rexVirtualJoystick') as VirtualJoystickPlugin | undefined;
        if (joyStickPlugin) {
            this.joyStick = joyStickPlugin.add(this, {
                x: 100,
                y: this.cameras.main.height - 100,
                radius: 60,
                base: { fill: 0x888888, alpha: 0.5 },
                thumb: { fill: 0xcccccc, alpha: 0.8 }
            });
            this.joyStickCursors = this.joyStick.createCursorKeys();
        }

        if (this.joyStickCursors) {
            this.player.setJoystick(this.joyStickCursors);
        }

        // Spawner
        this.time.addEvent({
            delay: 1000,
            loop: true,
            callback: this.spawnEnemy,
            callbackScope: this
        });

        // Collisions
        this.physics.add.collider(this.player, this.enemies, this.handlePlayerEnemyCollision, undefined, this);
        this.physics.add.overlap(this.projectiles, this.enemies, this.handleProjectileEnemyCollision, undefined, this);
        this.physics.add.overlap(this.player, this.expGems, this.handlePlayerGemCollision, undefined, this);

        // Events
        this.events.on('levelUp', this.onLevelUp, this);
        this.events.on('selectUpgrade', this.onSelectUpgrade, this);
        this.events.on('playerDead', this.onGameOver, this);
    }

    update(time: number, delta: number) {
        if (this.isPaused) return;

        if (this.player) {
            this.player.update(time, delta);
        }

        // Magnet logic for gems
        this.expGems.getChildren().forEach((child) => {
            const gem = child as ExpGem;
            if (gem.active && this.player.body && gem.body) {
                if (Phaser.Math.Distance.Between(this.player.x, this.player.y, gem.x, gem.y) < 150) {
                    gem.startMagnet(this.player);
                }
            }
        });
    }

    private spawnEnemy() {
        if (this.isPaused) return;

        const distance = 400;
        const angle = Phaser.Math.Between(0, 360);
        const x = this.player.x + distance * Math.cos(Phaser.Math.DegToRad(angle));
        const y = this.player.y + distance * Math.sin(Phaser.Math.DegToRad(angle));

        const clampX = Phaser.Math.Clamp(x, 0, 2000);
        const clampY = Phaser.Math.Clamp(y, 0, 2000);

        const enemy = this.enemies.get(clampX, clampY, ASSETS.ENEMY_BAT.key) as Enemy;
        if (enemy) {
            enemy.resetState(80, 30);
            enemy.setTarget(this.player);
        }
    }

    private handlePlayerEnemyCollision(_player: Player, enemy: Enemy) {
        this.player.takeDamage(10);
        // Simple bounce back
        const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, enemy.x, enemy.y);
        const bounceDistance = 50;
        enemy.x += Math.cos(angle) * bounceDistance;
        enemy.y += Math.sin(angle) * bounceDistance;
    }

    private handleProjectileEnemyCollision(projectile: Projectile, enemy: Enemy) {

        projectile.setActive(false);
        projectile.setVisible(false);

        const isDead = enemy.takeDamage(this.player.getDamage());

        if (isDead) {
            const gem = this.expGems.get(enemy.x, enemy.y, ASSETS.EXP_GEM.key) as ExpGem;
            if (gem) {
                gem.setActive(true);
                gem.setVisible(true);
                gem.resetState();
                if (gem.body) {
                    const body = gem.body as Phaser.Physics.Arcade.Body;
                    body.enable = true;
                    body.setAllowGravity(false);
                }
            }

            enemy.setActive(false);
            enemy.setVisible(false);
            enemy.body!.enable = false;

            this.killCount += 1;
            this.events.emit('updateScore', this.killCount);
        }
    }

    private handlePlayerGemCollision(_player: Player, gem: ExpGem) {
        gem.setActive(false);
        gem.setVisible(false);
        if (gem.body) gem.body.enable = false;

        gem.resetState(gem.getExpValue(), false);

        if (this.player && typeof this.player.gainExp === 'function') {
            this.player.gainExp(gem.getExpValue());
        }
    }

    private onLevelUp() {
        this.isPaused = true;
        this.physics.pause();
    }

    private onSelectUpgrade(type: string) {
        this.player.upgradeStat(type);
        this.isPaused = false;
        this.physics.resume();
    }

    private onGameOver() {
        if (this.isPaused) return;
        this.isPaused = true;
        this.physics.pause();
        this.scene.stop('UIScene');

        const coinsEarned = this.killCount;
        this.dataManager.addCoins(coinsEarned);

        this.scene.start('TitleScene', { coinsEarned, killCount: this.killCount });
    }

    private createGameTextures() {
        const graphics = this.make.graphics({ x: 0, y: 0 });

        // BACKGROUND GRID TILE
        // Always Force Regeneration
        if (this.textures.exists('background_grid')) this.textures.remove('background_grid');

        graphics.clear();
        graphics.fillStyle(0xE0E0E0); // Light Gray Base
        graphics.fillRect(0, 0, 128, 128);

        // Draw Cross
        graphics.lineStyle(4, 0xAAAAAA); // Darker gray
        // Horizontal
        graphics.moveTo(54, 64);
        graphics.lineTo(74, 64);
        // Vertical
        graphics.moveTo(64, 54);
        graphics.lineTo(64, 74);

        graphics.strokePath();

        graphics.generateTexture('background_grid', 128, 128);
        // IMPORTANT: Do NOT destroy graphics yet as we use it for other textures below, 
        // OR clear it. The original code destroyed it at the END.
        // We will clear it.

        // Player: Cyan Circle
        if (!this.textures.exists(ASSETS.PLAYER.key) || true) { // Force update
            graphics.clear();
            graphics.fillStyle(0x00FFFF); // Cyan
            graphics.fillCircle(16, 16, 16);
            graphics.lineStyle(2, 0xFFFFFF);
            graphics.strokeCircle(16, 16, 16);
            if (this.textures.exists(ASSETS.PLAYER.key)) this.textures.remove(ASSETS.PLAYER.key);
            graphics.generateTexture(ASSETS.PLAYER.key, 32, 32);
        }

        // ENEMY: Red Square (Bat)
        if (!this.textures.exists(ASSETS.ENEMY_BAT.key) || true) {
            graphics.clear();
            graphics.fillStyle(0xFF0000); // Red
            graphics.fillRect(0, 0, 32, 32);
            graphics.lineStyle(2, 0x880000);
            graphics.strokeRect(0, 0, 32, 32);
            if (this.textures.exists(ASSETS.ENEMY_BAT.key)) this.textures.remove(ASSETS.ENEMY_BAT.key);
            graphics.generateTexture(ASSETS.ENEMY_BAT.key, 32, 32);
        }

        // PROJECTILE: Yellow Circle (Bullet)
        if (!this.textures.exists(ASSETS.BULLET.key) || true) {
            graphics.clear();
            graphics.fillStyle(0xFFFF00); // Yellow
            graphics.fillCircle(8, 8, 8);
            if (this.textures.exists(ASSETS.BULLET.key)) this.textures.remove(ASSETS.BULLET.key);
            graphics.generateTexture(ASSETS.BULLET.key, 16, 16);
        }

        // EXP GEM: 4-Pointed Star (Greenish/Yellow)
        if (!this.textures.exists(ASSETS.EXP_GEM.key) || true) {
            graphics.clear();
            graphics.fillStyle(0x00FF00); // Green

            const size = 32;
            const half = size / 2;
            const inner = 6;

            graphics.beginPath();
            graphics.moveTo(half, 0);
            graphics.lineTo(half + inner, half - inner);
            graphics.lineTo(size, half);
            graphics.lineTo(half + inner, half + inner);
            graphics.lineTo(half, size);
            graphics.lineTo(half - inner, half + inner);
            graphics.lineTo(0, half);
            graphics.lineTo(half - inner, half - inner);
            graphics.closePath();
            graphics.fillPath();

            graphics.lineStyle(2, 0xFFFFFF);
            graphics.strokePath();

            if (this.textures.exists(ASSETS.EXP_GEM.key)) this.textures.remove(ASSETS.EXP_GEM.key);
            graphics.generateTexture(ASSETS.EXP_GEM.key, 32, 32);
        }

        graphics.destroy();
    }
}