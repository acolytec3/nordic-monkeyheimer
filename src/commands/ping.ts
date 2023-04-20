import { ChatInputCommandInteraction,SlashCommandBuilder  } from "discord.js";


const description = new SlashCommandBuilder().setName('ping').setDescription('replies with pong')

const execute = async (interaction: ChatInputCommandInteraction) => {
    await interaction.reply('pong')
}

const command = {
    data: description,
    execute: execute,
  }

export default command 