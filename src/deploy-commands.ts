import { SlashCommandBuilder } from "@discordjs/builders";
import { REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/rest/v9";
import { ChannelType } from "discord-api-types/payloads/v9";
import { Client } from "discord.js";
import { ChannelOption, Command, commands } from "./commands.js";
import { Config } from "./config.js";

async function getApplicationId(token: string) {
    const client = new Client({ intents: [] });
    await client.login(token);
    const id = client.application?.id;
    if (id == null) {
        throw new Error("Couldn't get the application id.");
    }
    client.destroy();
    return id;
}

function addChannelOption(builder: SlashCommandBuilder, option: ChannelOption) {
    builder.addChannelOption(optionBuilder =>
        optionBuilder
            .setName(option.name)
            .setDescription(option.description)
            .setRequired(option.required ?? false)
            .addChannelType(ChannelType.GuildVoice as number)
    );
}

function buildSlashCommand(command: Command) {
    const builder = new SlashCommandBuilder()
        .setName(command.name)
        .setDescription(command.description);

    for (const option of command.options ?? []) {
        switch (option.type) {
            case "channel":
                addChannelOption(builder, option);
                break;
        }
    }

    return builder.toJSON();
}

console.log("Loading config...");
const config = await Config.load();

console.log("Fetching application id...");
const applicationId = await getApplicationId(config.token);

const rest = new REST({ version: "9" }).setToken(config.token);

console.log("Registering global commands...");
const globalCommands = commands.filter(c => !c.isDebug).map(c => buildSlashCommand(c));
await rest.put(Routes.applicationCommands(applicationId), { body: globalCommands });

console.log("Registering guild commands...");
const guildCommands = commands.filter(c => c.isDebug).map(c => buildSlashCommand(c));
await rest.put(Routes.applicationGuildCommands(applicationId, config.debugGuildId), { body: guildCommands });
