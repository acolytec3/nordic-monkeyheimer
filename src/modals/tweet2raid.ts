import { ModalSubmitInteraction } from 'discord.js'
import { Level } from 'level'

const execute = async (interaction: ModalSubmitInteraction, db: Level<string, object>) => {
  const tweetUrl = interaction.fields.fields.get('tweetUrl')!.value
  const parts = tweetUrl.split('/')
  if (parts[2] === 'twitter.com' && parts[4] === 'status') {
    await interaction.reply({ content: 'Thank you for your submission.' })
    const config = await db.get('config') as any

    const res = await fetch(config.tweet2raidWebhook, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: `<@${
          interaction.user.id
        }> just submitted a tweet - ${interaction.fields.fields.get('tweetUrl')!.value!}`,
        components: [
          {
            type: 1,
            components: [
              {
                type: 2,
                label: 'Like ❤️',
                style: 1,
                custom_id: 'likeRaid',
              },
              {
                type: 2,
                label: 'Retweet 🔁',
                style: 1,
                custom_id: 'retweetRaid',
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
    await interaction.reply({ content: `Your entry ${tweetUrl} appears to be invalid.` })
  }
}

const modal = {
  execute: execute,
  name: 'tweet2raid',
}

export default modal
