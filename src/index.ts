import {
  Client,
  GatewayIntentBits,
  Collection,
  TextChannel,
  createChannel,
  HTTPError,
  MessagePayload,
  ChannelType,
} from 'discord.js'
import { readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { createRequire } from 'module'
import { fileURLToPath } from 'url'
import { Level } from 'level'
import * as http from 'http'
import { TwitterRegistrationRecord, UserRecord } from './types.js'
import { TwitterApi } from 'twitter-api-v2'
import { Guild } from 'discord.js'
const __dirname = dirname(fileURLToPath(import.meta.url))
const require = createRequire(import.meta.url)
const config = require('./config.json')
const db = new Level<string, object>('./src/db', { valueEncoding: 'json' })
const bot = new Client({ intents: [GatewayIntentBits.Guilds] })
const twitterClient = new TwitterApi({
  clientId: config.twitterClientId,
  clientSecret: config.twitterClientSecret,
})

const commands = new Collection()
const commandsPath = join(__dirname, 'commands')
const commandFiles = readdirSync(commandsPath).filter(
  (file) => file.endsWith('.ts') || file.endsWith('.js')
)
for (const file of commandFiles) {
  const filePath = join(commandsPath, file)
  const command = await import(filePath)
  commands.set(command.default.data.name, command)
}
const modals = new Collection()
const modalsPath = join(__dirname, 'modals')
const modalFiles = readdirSync(modalsPath).filter(
  (file) => file.endsWith('.ts') || file.endsWith('.js')
)
for (const file of modalFiles) {
  const modalPath = join(modalsPath, file)
  const modal = await import(modalPath)
  modals.set(modal.default.name, modal)
}

const buttons = new Collection()
const buttonsPath = join(__dirname, 'buttons')
const buttonFiles = readdirSync(buttonsPath).filter(
  (file) => file.endsWith('.ts') || file.endsWith('.js')
)
for (const file of buttonFiles) {
  const buttonPath = join(buttonsPath, file)
  const button = await import(buttonPath)
  buttons.set(button.default.name, button)
}

bot.on('interactionCreate', async (interaction) => {
  if (interaction.isChatInputCommand()) {
    const command: any = commands.get(interaction.commandName)
    try {
      if (!(db.status === 'open')) {
        await db.open()
      }
      await command.default.execute(interaction, db)
    } catch (err: any) {
      console.log(err)
      await interaction.reply({ content: 'Error!!!', ephemeral: true })
      return
    }
  }

  if (interaction.isModalSubmit()) {
    const modal: any = modals.get(interaction.customId)
    try {
      if (modal?.default) await modal.default.execute(interaction, db)
      return
    } catch (err: any) {
      console.log(err.message)
      return
    }
  }

  if (interaction.isButton()) {
    const button: any = buttons.get(interaction.customId)

    try {
      await button.default.execute(interaction, db)
    } catch (err: any) {
      console.log(err)
      await interaction.reply({ content: 'Error!!!', ephemeral: true })
      return
    }
  }
})

bot.once('ready', async () => {
  console.log(`We're alive and kicking!`)

  // Setup channels
  let guild = bot.guilds.cache.find((guild) => config.guildId === guild.id)
  if (guild === undefined) {
    guild = await bot.guilds.fetch(config.guildId)
  }
  let submitTweetChannel = guild.channels.cache.find(
    (channel) => (channel as any).name === 'moon-math-admin'
  ) as TextChannel
  if (!submitTweetChannel) {
    submitTweetChannel = await guild.channels.create({
      type: ChannelType.GuildText,
      name: 'submit-tweet',
    })
    const everyoneRole = guild.roles.cache.find((role) => role.name === '@everyone')!
    submitTweetChannel.permissionOverwrites.edit(everyoneRole, { SendMessages: false })
  }

  try {
    const lastMsg = (await db.get('lastTweet2RaidMsg')) as { id: string }
    if (lastMsg.id !== undefined) {
      // Post tweet2raid message if not already found
      const msg = await submitTweetChannel.send({
        content: 'Click below to submit a tweet',
        components: [
          {
            type: 1,
            components: [
              {
                type: 2,
                label: `Submit Tweet`,
                style: 1,
                custom_id: 'tweet2raid',
              },
            ],
          },
        ],
      })
      db.put('lastTweet2RaidMsg', { id: msg.id })
    }
  } catch {}

  let admin = guild.channels.cache.find(
    (channel) => (channel as any).name === 'moon-math-admin'
  ) as TextChannel
  if (!admin) {
    admin = await guild.channels.create({ type: ChannelType.GuildText, name: 'moon-math-admin' })
    const everyoneRole = guild.roles.cache.find((role) => role.name === '@everyone')!
    admin.permissionOverwrites.edit(everyoneRole, { ViewChannel: false })
  }
  let webhooks = (await admin.fetchWebhooks()).filter(
    (webhook) => webhook.owner?.id === bot.user?.id && webhook.name === 'Moon Math Raider'
  )
  let hook
  if (webhooks.size === 0) {
    // Set up a new tweet2raid webhook if not found
    hook = await admin.createWebhook({
      name: 'Moon Math Raider',
    })
  } else {
    hook = webhooks.first()
  }
  if (hook) {
    config.tweet2raidWebhook = hook.url
  }

  let engage2Earn = bot.channels.cache.find(
    (channel) => (channel as any).name === 'engage-to-earn'
  ) as TextChannel
  if (!engage2Earn) {
    engage2Earn = await guild.channels.create({ type: ChannelType.GuildText, name: 'engage-to-earn' })
    const everyoneRole = guild.roles.cache.find((role) => role.name === '@everyone')!
    engage2Earn.permissionOverwrites.edit(everyoneRole, { SendMessages: false })
  }
  let engageWebhooks = (await engage2Earn.fetchWebhooks()).filter(
    (webhook) => webhook.owner?.id === bot.user?.id && webhook.name === 'Moon Math Raider'
  )
    let engageHook
  if (engageWebhooks.size === 0) {
    // Set up a new raid2Earn webhook if not found
    engageHook = await engage2Earn.createWebhook({
      name: 'Moon Math Raider',
    })
  } else {
    engageHook = engageWebhooks.first()
  }

  if (engageHook) {
    config.raid2earnWebhook = engageHook.url
  }
  await db.put('config', config)
})

bot.login(config.token)

// Simple HTTP server to capture twitter authorization requests
const authorizer = async (req: http.IncomingMessage, res: http.ServerResponse) => {
  const id = req.url?.split('&code')[0].split('state=')[1]
  if (id) {
    try {
      // Retrieve twitter registration record from DB
      const record = (await db.get(id)) as TwitterRegistrationRecord
      console.log(record)
      if (record) {
        try {
          const user = (await db.get(record.username)) as UserRecord
          user.twitter = record.twitter
        } catch {
          await db.put(record.username, { twitter: record.twitter, balance: '0' })
          await twitterClient.loginWithOAuth2({
            codeVerifier: record.code,
            redirectUri: config.ngrokLink,
            code: req.url!.split('&code=')[1],
          })
        }

        await db.del(id) // Delete twitter registration record once fulfilled
      } else {
        res.setHeader('Content-Type', 'application/json')
        res.writeHead(400)
        res.end(JSON.stringify({ message: "We don't recognize this request" }))
      }
    } catch (err) {
      res.setHeader('Content-Type', 'application/json')
      res.writeHead(400)
      res.end(JSON.stringify({ message: "We don't recognize this request" }))
    }
  }
  res.setHeader('Content-Type', 'application/json')
  res.writeHead(200)
  res.end(JSON.stringify({ message: 'thanks for registering' }))
}
const server = http.createServer(authorizer)
server.listen(3500)
