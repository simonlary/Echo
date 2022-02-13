interface BaseOption {
    name: string;
    description: string;
    required?: boolean;
}

export interface ChannelOption extends BaseOption {
    type: "channel";
    channelType: "voice";
}

type Option = ChannelOption;

export interface Command {
    name: string;
    description: string;
    options?: Option[];
    isDebug?: boolean;
}

const commands = {
    moveto: {
        description: "Move all the people in your voice channel to another voice channel.",
        options: [
            {
                name: "channel" as const,
                description: "The voice channel to move everyone to.",
                type: "channel" as const,
                channelType: "voice" as const,
                required: true,
            }
        ],
        isDebug: true
    },
    link: {
        description: "Get the link to add the bot to another server.",
        isDebug: true
    }
};

export type CommandName = keyof typeof commands;

const commandsArray: Command[] = Object.entries(commands).map(([name, definition]) => ({ name, ...definition }));

export { commandsArray as commands };
