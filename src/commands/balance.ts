import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js'
import { Level } from 'level'

const description = new SlashCommandBuilder()
  .setName('balance')
  .setDescription('how much moolah do I have?')

const execute = async (interaction: ChatInputCommandInteraction, db: Level<string, object>) => {
  try {
    const record = (await db.get(interaction.user.username)) as any
    if (record.balance !== undefined) {
      await interaction.reply(`Your balance is ${record.balance} $MOON`)
    } else {
      await interaction.reply(`Your balance is 0 $MOON`)
    }
  } catch (err: any) {
    if (err.code === 'LEVEL_NOT_FOUND') await interaction.reply(`Your balance is 0 $MOON`) 
    else await interaction.reply(`Something went wrong.  Please try again later`)
  }
}

const command = {
  data: description,
  execute: execute,
}

export default command
