import { ActionRowBuilder, ChatInputCommandInteraction,ModalActionRowComponentBuilder,ModalBuilder,SlashCommandBuilder, TextInputBuilder, TextInputStyle  } from "discord.js";
import { Level } from "level";

const description = new SlashCommandBuilder().setName('tweet2raid').setDescription('tweet to raid')

const execute = async (interaction: ChatInputCommandInteraction, db: Level<string, object>) => {
    const modal = new ModalBuilder().setCustomId('tweet2raid').setTitle('Submit Tweet')
    const urlInput = new TextInputBuilder().setCustomId('tweetUrl').setLabel('Tweet Url').setStyle(TextInputStyle.Short)
    const row = new ActionRowBuilder<TextInputBuilder>().addComponents([urlInput])
    modal.addComponents(row)
    await interaction.showModal(modal)
}

const command = {
    data: description,
    execute: execute,
  }

export default command 