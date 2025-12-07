export type UpgradeType = 'damage' | 'speed' | 'maxHp';

export type SaveData = {
    totalCoins: number;
    upgradeLevelDamage: number;
    upgradeLevelSpeed: number;
    upgradeLevelMaxHP: number;
};

export type PlayerMetaStats = {
    baseDamage: number;
    baseSpeed: number;
    baseMaxHp: number;
};

const DEFAULT_DATA: SaveData = {
    totalCoins: 0,
    upgradeLevelDamage: 0,
    upgradeLevelSpeed: 0,
    upgradeLevelMaxHP: 0
};

export default class DataManager {
    private static _instance: DataManager;
    private readonly storageKey = 'yoru_survivor_meta';
    private data: SaveData = { ...DEFAULT_DATA };

    private constructor() {
        this.load();
    }

    static get instance(): DataManager {
        if (!this._instance) {
            this._instance = new DataManager();
        }
        return this._instance;
    }

    get saveData(): SaveData {
        return { ...this.data };
    }

    getPlayerMetaStats(): PlayerMetaStats {
        const damageBonus = this.data.upgradeLevelDamage * 5;
        const speedBonus = this.data.upgradeLevelSpeed * 12;
        const maxHpBonus = this.data.upgradeLevelMaxHP * 20;

        return {
            baseDamage: 10 + damageBonus,
            baseSpeed: 200 + speedBonus,
            baseMaxHp: 100 + maxHpBonus
        };
    }

    addCoins(amount: number): void {
        if (amount <= 0) return;
        this.data.totalCoins += amount;
        this.persist();
    }

    spendCoins(cost: number): boolean {
        if (cost <= 0) return true;
        if (this.data.totalCoins < cost) return false;
        this.data.totalCoins -= cost;
        this.persist();
        return true;
    }

    upgrade(type: UpgradeType, cost: number): boolean {
        if (!this.spendCoins(cost)) return false;

        switch (type) {
            case 'damage':
                this.data.upgradeLevelDamage += 1;
                break;
            case 'speed':
                this.data.upgradeLevelSpeed += 1;
                break;
            case 'maxHp':
                this.data.upgradeLevelMaxHP += 1;
                break;
        }

        this.persist();
        return true;
    }

    private load(): void {
        if (typeof localStorage === 'undefined') return;

        try {
            const raw = localStorage.getItem(this.storageKey);
            if (!raw) {
                this.persist();
                return;
            }
            const parsed = JSON.parse(raw) as Partial<SaveData>;
            this.data = { ...DEFAULT_DATA, ...parsed };
        } catch (error) {
            console.warn('Failed to load save data. Using defaults.', error);
            this.data = { ...DEFAULT_DATA };
            this.persist();
        }
    }

    private persist(): void {
        if (typeof localStorage === 'undefined') return;

        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.data));
        } catch (error) {
            console.warn('Failed to save meta progression data.', error);
        }
    }
}
