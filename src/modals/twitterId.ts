import { ModalSubmitInteraction } from 'discord.js'
import { Level } from 'level'
import { createRequire } from 'module'
import { TwitterApi } from 'twitter-api-v2'
const require = createRequire(import.meta.url)
const config = require('../../config.json')
const client = new TwitterApi({clientId: config.twitterClientId, clientSecret: config.twitterClientSecret})
const execute = async (interaction: ModalSubmitInteraction, db: Level<string, object>) => {
  const link = client.generateOAuth2AuthLink(config.ngrokLink, {
    scope: ['tweet.read'],
    state: interaction.user.id
  })
  await db.put(interaction.user.id, { username: interaction.user.username, twitter: interaction.fields.fields.get('username')!.value})
  await interaction.reply({
    content: `It looks like you haven't registered.`,
    embeds: [
      {
        title: 'Register',
        url: link.url,
      },
    ],
    ephemeral: true,
  })
}
  

const modal = {
  execute: execute,
  name: 'twitterId',
}

export default modal
