import { Routes } from 'discord.js'
import { REST } from '@discordjs/rest'
import { join, dirname } from 'node:path'
import { readdirSync} from 'node:fs'
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url))
import config from '../config.json' assert { type: 'json' }

const commands = []

const { token, clientId, guildId } = config
const commandsPath = join(__dirname, 'commands');
const commandFiles = readdirSync(commandsPath).filter(file => file.endsWith('.ts'));

for (const file of commandFiles) {
	const filePath = join(commandsPath, file);
    const command = await import(filePath)
    commands.push(command.default.data.toJSON())
}

const rest = new REST({ version: '10'}).setToken(token)
rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands })
	.then(() => console.log('Successfully registered application commands.'))
	.catch(console.error)

