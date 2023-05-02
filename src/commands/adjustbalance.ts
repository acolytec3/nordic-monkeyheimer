import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js'
import { Level } from 'level'
import { UserRecord } from '../types.js'
const description = new SlashCommandBuilder()
  .setName('adjustbalance')
  .setDescription('adjust the balance for a user')
  .addNumberOption((option) =>
    option.setName('amount').setDescription('Amount to adjust a user balance by').setRequired(true)
  )
  .addUserOption((option) =>
    option.setName('user').setDescription('user whose balance is being adjusted').setRequired(true)
  ).setDefaultMemberPermissions(1)  // Limit this command to mods (i.e. people who can manage the channel/server)

const execute = async (interaction: ChatInputCommandInteraction, db: Level<string, object>) => {
  const amount = parseInt(interaction.options.get('amount')!.value! as string)
  const user = interaction.options.get('user')!.user!.username!
  try {
    const record = (await db.get(user)) as UserRecord
    if (record.balance !== undefined) {
      if (parseInt(record.balance) + amount < 0) {
        await interaction.reply({content: 'Balance cannot go negative', ephemeral: true})
        return
      }
      record.balance = (parseInt(record.balance) + amount).toString()
    } else {
      record.balance = amount > 0 ? amount.toString() : '0'
    }
    await db.put(user, record)
    await interaction.reply({
      content: `${user}'s balance has been updated to ${record.balance}`,
      ephemeral: true,
    })
  } catch (err: any) {
    if (err.code === 'LEVEL_NOT_FOUND') {
      const record: UserRecord = {
        twitter: '',
        balance: amount > 0 ? amount.toString() : '0',
      }
      await db.put(user, record)
      await interaction.reply({
        content: `${user}'s balance has been updated to ${amount}`,
        ephemeral: true,
      })
    }
  }
}

const command = {
  data: description,
  execute: execute,
}

export default command
