import {
  ActionRowBuilder,
  ButtonInteraction,
  ChatInputCommandInteraction,
  ModalActionRowComponentBuilder,
  ModalBuilder,
  ModalSubmitInteraction,
  SlashCommandBuilder,
  TextInputBuilder,
  TextInputStyle,
} from 'discord.js'
import { Level } from 'level'

const description = new SlashCommandBuilder().setName('tweet2raid').setDescription('tweet to raid')

const filter = (i: ModalSubmitInteraction) => {
  i.deferUpdate()
  return true
}

const execute = async (interaction: ButtonInteraction, db: Level<string, object>) => {
  const modal = new ModalBuilder().setCustomId('tweet2raid').setTitle('Submit Tweet')
  const urlInput = new TextInputBuilder()
    .setCustomId('tweetUrl')
    .setLabel('Tweet Url')
    .setStyle(TextInputStyle.Short)
  const row = new ActionRowBuilder<TextInputBuilder>().addComponents([urlInput])
  modal.addComponents(row)
  await interaction.showModal(modal)
  let modalResponse
  try {
    modalResponse = await interaction.awaitModalSubmit({ time: 10000, filter })
  } catch (err) {
    console.log('tweet2raid modal response timed out')
    interaction.followUp({content: 'No/invalid response received.  Please try again', ephemeral: true})
    return
  }
  const tweetUrl = modalResponse.fields.fields.get('tweetUrl')!.value
  const parts = tweetUrl.split('/')
  if (parts[2] === 'twitter.com' && parts[4] === 'status') {
    await interaction.followUp({ content: 'Thank you for your submission.', ephemeral: true })
    const config = (await db.get('config')) as any

    const res = await fetch(config.tweet2raidWebhook, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: `<@${
          interaction.user.id
        }> just submitted a tweet - ${modalResponse.fields.fields.get('tweetUrl')!.value!}`,
        components: [
          {
            type: 1,
            components: [
              {
                type: 2,
                label: 'Approve',
                style: 1,
                custom_id: 'approveRaid',
              },
              {
                type: 2,
                label: 'Deny',
                style: 1,
                custom_id: 'denyRaid',
              },
            ],
          },
        ],
      }),
    })
  } else {
    await interaction.followUp({
      content: `Your entry ${tweetUrl} appears to be invalid.`,
      ephemeral: true,
    })
  }
}

const command = {
  name: 'tweet2raid',
  execute: execute,
}

export default command
