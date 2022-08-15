import { prisma, logger, buildError, ModelRequest, ModelResponse } from '.'
import * as bcrypt from 'bcrypt'
import { Context } from './singleton'

export async function isUsernameAvailable(username: string): Promise<boolean> {
	return await prisma.user.count({
		where: {
			username: username
		}
	}) === 0
}

export function isValidUsernameLength(username: string): boolean {
	return username.length > 2 && username.length <= 16
}

export function isValidUsernameChars(username: string): boolean {
	return /^[a-zA-Z0-9\.\_]+$/.test(username)
}

export interface RegisterParams {
	username: string,
	password: string
}

class UsernameError extends Error {
	constructor(title: string, description: string) {
		super()
		this.name = title;
		this.message = description;
	}
}
class InvalidCharacters extends UsernameError { }
class InvalidLength extends UsernameError { }
class NameTaken extends UsernameError { }

export default async function createUser(user: any, ctx?: Context) {
	let len = user.username.length
	if (!isValidUsernameLength(user.username)) {
		throw new InvalidLength("Username Too Long", `A username can be a maximum of 16 characters long. Yours is ${len}`)
	}

	if (!isValidUsernameChars(user.username)) {
		throw new InvalidCharacters("Invalid Username", "A username can only contain letters, numbers, '_', and '.'");
	}

	if (!await isUsernameAvailable(user.username)) {
		throw new NameTaken("Name Taken", `The username '${user.username}' already exists`)
	}

	const salt = process.env.P_SALT as string;
	const password = await bcrypt.hash(user.password, salt);

	const newUser = await (ctx?.prisma ?? prisma).user.create({
		data: {
			username: user.username,
			password: password
		}
	})

	return newUser
}

export async function registerUser(req: ModelRequest<RegisterParams>, res: ModelResponse): Promise<void> {
	try {
		let user = await createUser(req.body);
		logger.info(`Created new user: ${user.username} (# ${user.id})`)
		res.send(user)
	} catch (usernameError) {
		res.status(400).send(usernameError)
	}
}