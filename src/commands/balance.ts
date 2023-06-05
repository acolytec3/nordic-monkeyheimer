import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js'
import { Level } from 'level'
import { UserRecord } from '../types.js'
import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const config = require('../config.json')
const description = new SlashCommandBuilder()
  .setName('balance')
  .setDescription('how much moolah do I have?')

const execute = async (interaction: ChatInputCommandInteraction, db: Level<string, object>) => {  
  try {
    const record = (await db.get(interaction.user.username)) as UserRecord
    if (record.balance !== undefined) {
      await interaction.reply({ content: `Your balance is ${record.balance} ${config.currency}`, ephemeral: true})
    } else {
      await interaction.reply({ content: `Your balance is 0 $${config.currency}`, ephemeral: true})
    }
  } catch (err: any) {
    if (err.code === 'LEVEL_NOT_FOUND') {
      await interaction.reply({ content: `Your balance is 0 $${config.currency}`, ephemeral: true}) 
      await db.put(interaction.user.username, { balance: '0', twitter: ''})
    }
    else await interaction.reply({content: `Something went wrong.  Please try again later`, ephemeral: true})
  }
}

const command = {
  data: description,
  execute: execute,
}

export default command
