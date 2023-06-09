import {
  ActionRowBuilder,
  ButtonComponent,
  ButtonInteraction,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} from 'discord.js'
import { Level } from 'level'
import { TwitterApi } from 'twitter-api-v2'
import { createRequire } from 'module'
import { RaidRecord, UserRecord } from '../types.js'
const require = createRequire(import.meta.url)
const config = require('../config.json')
const client = new TwitterApi(config.twitterAPIKey)

const twitterIdModal = new ModalBuilder().setCustomId('twitterId').setTitle('Connect Twitter')
const urlInput = new TextInputBuilder()
  .setCustomId('username')
  .setLabel('Twitter Username')
  .setStyle(TextInputStyle.Short)
const row = new ActionRowBuilder<TextInputBuilder>().addComponents([urlInput])
twitterIdModal.addComponents(row)

const execute = async (interaction: ButtonInteraction, db: Level<string, object>) => {
  let record: UserRecord
  try {
    try {
      record = (await db.get(interaction.user.username)) as UserRecord
      if (record.twitter === undefined || record.twitter === '')
        throw new Error('no twitter handle')
    } catch {
      // Twitter isn't registered with app
      await interaction.showModal(twitterIdModal)
      return
    }

    const tweetId = interaction.message.content.split('/status/')[1]
    const tweetsDb = await db.sublevel<string, object>('tweets', {
      keyEncoding: 'utf8',
      valueEncoding: 'json',
    })

    const tweet = (await tweetsDb.get(tweetId)) as RaidRecord
    if (tweet.handles.filter((el) => el === interaction.user.id).length > 0) {
      // Check to see if user already interacted with tweet
      await interaction.reply({
        content: `You already got paid! Don't be greedy!`,
        ephemeral: true,
      })
      return
    }
    let interactions
    let interactionByUser = []

    // Check to see if user liked tweet
    interactions = await client.readOnly.v2.tweetLikedBy(tweetId)
    interactionByUser = interactions.data !== undefined ? interactions.data.filter(
      (el: { id: string; name: string; username: string }) => el.username === record.twitter
    ) : []

    if (interactionByUser.length === 0) {
      // only check for retweets if no likes found
      interactions = await client.readOnly.v2.tweetRetweetedBy(tweetId)
      interactionByUser = interactions.data !== undefined ? interactions.data.filter(
        (el: { id: string; name: string; username: string }) => el.username === record.twitter
      ) : []
    }

    if (interactionByUser.length >= 1) {
      // Verify that user's twitter handle appears in list of likes
      await interaction.reply({
        content: `Your $${config.currency} is on its way ${record.twitter}`,
        ephemeral: true,
      })
      record.balance = (parseInt(record.balance ?? '0') + parseInt(tweet.reward)).toString()
      await db.put(interaction.user.username, record) // Store user's updated balance
      tweet.handles.push(interaction.user.id)
      await tweetsDb.put(tweetId, tweet) // Update raid record
    } else {
      await interaction.reply({ content: `You do not appear to have done any raiding.  If you have, please try again in a few minutes.`, ephemeral: true })
    }
  } catch (err) {
    console.log(err)
    await interaction.reply({ content: 'Something went wrong.  Tell the mods!', ephemeral: true })
  }
}
const button = {
  execute: execute,
  name: 'earn',
}

export default button
