class SuperEventManager {
    static instance = null;

    static getInstance() {
        if (!SuperEventManager.instance) {
            SuperEventManager.instance = new SuperEventManager();
        }
        return SuperEventManager.instance;
    }

    constructor() {
        if (SuperEventManager.instance) {
            throw new Error("SuperEventManager is a singleton, use getInstance() to get the instance");
        }
        this.events = new Map();
    }

    on(event, callback) {
        if (!this.events.has(event)) {
            this.events.set(event, [callback]);
        } else {
            this.events.get(event).push(callback);
        }
    }

    off(event, callback) {
        if (this.events.has(event)) {
            this.events.get(event).splice(this.events.get(event).indexOf(callback), 1);
        }
    }

    emit(event, ...args) {
        if (this.events.has(event)) {
            return this.events.get(event).map(callback => callback(...args));
        }
    }

    call(event, ...args) {
        if (this.events.has(event)) {
            const result = this.events.get(event).map(callback => callback(...args));
            if (result.length === 1) {
                return result[0];
            } else {
                return result;
            }
        }
    }
    
}


// Example usage:
class Hero {
    constructor(name = "Hero") {
        this.name = name;
        this.events = SuperEventManager.getInstance();
    }

    emit(event, ...args) {
        return this.events.emit(event, ...args);
    }

    takeDamage(damage) {

        const healthLeft = this.events.call("hero:damage", { damage, sender: this });
        console.log("[Hero] I got", healthLeft, "health left");
    }
}

class HealthComponent {
    constructor() {
        this.maxHealth = 100;
        this.heros = new Map();
        this.events = SuperEventManager.getInstance();
        this.events.on("health:get", this.getHealth.bind(this));
        this.events.on("hero:damage", this.takeDamage.bind(this));
    }

    takeDamage({ damage, sender }) {
        if (!this.heros.has(sender)) {
            this.heros.set(sender, this.maxHealth);
        }
        const health = this.heros.get(sender);
        const healthLeft = health - damage;
        this.heros.set(sender, healthLeft);

        if (healthLeft <= 0) {
            this.events.emit("health:dead");
        }

        this.events.emit("health:damage", { damage, sender, healthLeft });

        return healthLeft;

    }

    getHealth(sender) {
        if (!this.heros.has(sender)) {
            this.heros.set(sender, this.maxHealth);
        }
        return this.heros.get(sender);
    }
}

class UI {
    constructor() {
        this.events = SuperEventManager.getInstance();
        this.events.on("health:damage", this.showDamage.bind(this));
    }

    showDamage({ damage, sender, healthLeft }) {
        console.log("Hero named ", sender.name, "took", damage, "damage, now has", healthLeft, "health");
    }

}

// Example usage:
const hero = new Hero();
const healthComponent = new HealthComponent();
const ui = new UI();

hero.takeDamage(10);

console.log(hero.events.call("health:get", hero));


