import { readFile } from "fs/promises";

const Classes = ["Assassin", "Guardian", "Hunter", "Mage", "Warrior"] as const;
type Class = typeof Classes[number];

const Damages = ["Magical", "Physical"] as const;
type Damage = typeof Damages[number];

const Ranges = ["Melee", "Ranged"] as const;
type Range = typeof Ranges[number];

const Pantheons = ["Arthurian", "Babylonian", "Celtic", "Chinese", "Egyptian", "Great Old Ones", "Greek", "Hindu", "Japanese", "Mayan", "Norse", "Polynesian", "Roman", "Slavic", "Yoruba"] as const;
type Pantheon = typeof Pantheons[number];

// https://raw.githubusercontent.com/MajorVengeance/smite-random-god/master/gods.json
interface God {
    id: number,
    name: string,
    class: Class,
    damage: Damage,
    range: Range,
    pantheon: Pantheon
}

export class Gods {
    public static async load() {
        const rawContent = await readFile("gods.json", "utf8");
        const parsedContent = JSON.parse(rawContent) as God[];
        return new Gods(parsedContent);
    }

    private constructor(private readonly gods: God[]) { }

    public withClass(theClass: string) {
        return new Gods(this.gods.filter(g => g.class === theClass));
    }

    public withDamage(damage: string) {
        return new Gods(this.gods.filter(g => g.damage === damage));
    }

    public withRange(range: string) {
        return new Gods(this.gods.filter(g => g.range === range));
    }

    public withPantheon(pantheon: string) {
        return new Gods(this.gods.filter(g => g.pantheon === pantheon));
    }

    public getRandom(number: number) {
        return this.gods
            .sort(() => .5 - Math.random())
            .slice(0, number)
            .map(g => g.name);
    }
}
