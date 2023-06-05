import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js'
import { Level } from 'level'
import { UserRecord } from '../types.js'
import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const config = require('../config.json')
const description = new SlashCommandBuilder().setName('delete').setDescription('delete a user')
.addUserOption((option) =>
option.setName('user').setDescription('user whose registration is being deleted').setRequired(true)
).setDefaultMemberPermissions(1)  // Limit this command to mods (i.e. people who can manage the channel/server)

const execute = async (interaction: ChatInputCommandInteraction, db: Level<string, object>) => {
  try {
    await db.del(interaction.user.username)
    await interaction.reply(`${interaction.user.username} removed from database`)
  } catch (err: any) {
    await interaction.reply({
      content: `Something went wrong.  Please try again later`,
      ephemeral: true,
    })
  }
}

const command = {
  data: description,
  execute: execute,
}

export default command
