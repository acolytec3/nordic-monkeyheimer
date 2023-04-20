import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, ModalBuilder, ModalSubmitInteraction, TextInputBuilder, TextInputStyle } from 'discord.js'
import { Level } from 'level'

const filter = (i: ModalSubmitInteraction) => {
  i.deferUpdate()
  return true
}

const execute = async (interaction: ButtonInteraction, db: Level<string, object>) => {
  console.log(interaction)
  const tweetUrl = interaction.message.content.substring(
    interaction.message.content.indexOf('https://')
  )
  const tweetId = tweetUrl.split('status/')[1]
  const config = (await db.get('config')) as any

  const tweetsDb = await db.sublevel<string, object>('tweets', { keyEncoding: 'utf8', valueEncoding: 'json' })
  await tweetsDb.open()
  try {
    const tweet = await tweetsDb.get(tweetId + 'retweet')
    if (tweet === undefined) {
      throw new Error('tweet isnt already setup')
    }
    await interaction.reply('This raid is already started')
  } catch (err: any) {
    const modal = new ModalBuilder().setCustomId('raidDeets').setTitle('Raid Details')
    const rewardInput = new TextInputBuilder().setCustomId('reward').setLabel('Raid Reward').setStyle(TextInputStyle.Short)
    const textRow = new ActionRowBuilder<TextInputBuilder>().addComponents([rewardInput])
    modal.addComponents(textRow)
    await interaction.showModal(modal)
    const res = await interaction.awaitModalSubmit({ time: 10000, filter })
    const reward = res.fields.fields.get('reward')!
    await tweetsDb.put(tweetId + 'retweet', { type: 'retweet', handles: [], reward: reward.value ?? '100'})
    const res2 = await fetch(config.raid2earnWebhook, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: `Raid this tweet - ${tweetUrl}`,
        components: [
          {
            type: 1,
            components: [
              {
                type: 2,
                label: 'Retweet 🔁',
                style: 5,
                url: 'https://twitter.com/intent/retweet?tweet_id=' + tweetId,
              },
              {
                type: 2,
                label: 'Give me $MOON',
                style: 1,
                custom_id: 'earn',
              },
            ],
          },
        ],
      }),
    })
    await interaction.followUp({ content: 'Lets get this raid started.', ephemeral: true })
  }
}

const button = {
  execute: execute,
  name: 'retweetRaid',
}

export default button
