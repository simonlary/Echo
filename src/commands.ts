interface BaseOption {
    name: string;
    description: string;
    required: boolean;
}

export interface ChannelOption extends BaseOption {
    type: "channel";
    channelType: "voice";
}

export interface StringOption extends BaseOption {
    type: "string";
    autocomplete?: boolean;
    choices?: string[];
}

export interface IntegerOption extends BaseOption {
    type: "integer";
    minimum?: number;
    maximum?: number;
}

type Option = ChannelOption | StringOption | IntegerOption;

export interface Command {
    name: string;
    description: string;
    options?: Option[];
    guildCommand?: boolean;
}

const commands = {
    audio: {
        description: "Execute a custom audio command.",
        options: [
            {
                name: "command",
                description: "Which audio command to execute.",
                type: "string" as const,
                required: false,
                autocomplete: true,
            },
        ],
        guildCommand: true // This will always be true
    },
    gods: {
        description: "Get a list of random Smite gods.",
        options: [
            {
                name: "number",
                description: "The number of random gods to pick.",
                type: "integer" as const,
                required: true,
                minimum: 1
            },
            {
                name: "class",
                description: "The class of gods you want random gods from.",
                type: "string" as const,
                required: false,
                choices: ["Assassin", "Guardian", "Hunter", "Mage", "Warrior"]
            },
            {
                name: "damage",
                description: "The damage type of gods you want random gods from.",
                type: "string" as const,
                required: false,
                choices: ["Magical", "Physical"]
            },
            {
                name: "range",
                description: "The range of gods you want random gods from.",
                type: "string" as const,
                required: false,
                choices: ["Melee", "Ranged"]
            },
            {
                name: "pantheon",
                description: "The range of gods you want random gods from.",
                type: "string" as const,
                required: false,
                choices: ["Arthurian", "Babylonian", "Celtic", "Chinese", "Egyptian", "Great Old Ones", "Greek", "Hindu", "Japanese", "Mayan", "Norse", "Polynesian", "Roman", "Slavic", "Yoruba"]
            },
        ],
        guildCommand: true,
    },
    link: {
        description: "Get the link to add the bot to another server.",
        guildCommand: true,
    },
    moveto: {
        description: "Move all the people in your voice channel to another voice channel.",
        options: [
            {
                name: "channel",
                description: "The voice channel to move everyone to.",
                type: "channel" as const,
                required: true,
                channelType: "voice" as const,
            }
        ],
        guildCommand: true,
    },
};

export type CommandName = keyof typeof commands;

const commandsArray: Command[] = Object.entries(commands).map(([name, definition]) => ({ name, ...definition }));

export { commandsArray as commands };
