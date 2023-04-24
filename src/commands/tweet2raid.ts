import { ActionRowBuilder, ChatInputCommandInteraction,ModalActionRowComponentBuilder,ModalBuilder,ModalSubmitInteraction,SlashCommandBuilder, TextInputBuilder, TextInputStyle  } from "discord.js";
import { Level } from "level";

const description = new SlashCommandBuilder().setName('tweet2raid').setDescription('tweet to raid')

const filter = (i: ModalSubmitInteraction) => {
  i.deferUpdate()
  return true
}


const execute = async (interaction: ChatInputCommandInteraction, db: Level<string, object>) => {
    const modal = new ModalBuilder().setCustomId('tweet2raid').setTitle('Submit Tweet')
    const urlInput = new TextInputBuilder().setCustomId('tweetUrl').setLabel('Tweet Url').setStyle(TextInputStyle.Short)
    const row = new ActionRowBuilder<TextInputBuilder>().addComponents([urlInput])
    modal.addComponents(row)
    await interaction.showModal(modal)
    const modalResponse = await interaction.awaitModalSubmit({ time: 10000, filter})
    const tweetUrl = modalResponse.fields.fields.get('tweetUrl')!.value
    const parts = tweetUrl.split('/')
    if (parts[2] === 'twitter.com' && parts[4] === 'status') {
      await interaction.followUp({ content: 'Thank you for your submission.', ephemeral: true })
      const config = await db.get('config') as any
  
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
      await interaction.followUp({ content: `Your entry ${tweetUrl} appears to be invalid.`, ephemeral: true })
    }
}

const command = {
    data: description,
    execute: execute,
  }

export default command 