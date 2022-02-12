interface BaseOption {
    name: string;
    description: string;
    required?: boolean;
}

export interface ChannelOption extends BaseOption {
    type: "channel";
    channelType: "voice";
}

export type Option = ChannelOption;

export interface Command {
    name: string;
    description: string;
    options?: Option[];
    isDebug?: boolean;
}

const commands: Command[] = [
    {
        name: "moveto",
        description: "Move all the people in your voice channel to another voice channel.",
        options: [
            {
                name: "channel",
                description: "The voice channel to move everyone to.",
                type: "channel",
                channelType: "voice",
                required: true,
            }
        ],
        isDebug: true
    },
    {
        name: "link",
        description: "Get the link to add the bot to another server.",
        isDebug: true
    }
];

export { commands };