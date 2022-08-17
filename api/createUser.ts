import { prisma, logger, ModelRequest, ModelResponse, CaughtApiException } from '.'
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

export function isValidPasswordLength(password: string): boolean {
	return password.length > 5 && password.length < 128
}

export function isValidPasswordChars(password: string): boolean {
	return /^[a-zA-Z0-9~`!@#$%^&*()_\\+={[}\]\|:;"'<,>.\?\/-]+$/.test(password)
}

export interface RegisterParams {
	username: string,
	password: string
}
// export class UserCreationError extends CaughtApiException {
// 	constructor(title: string, description: string) {
// 		super(title, description)
// 	}
// }

export default async function createUser(user: any, ctx?: Context) {
	let len = user.username.length
	if (!isValidUsernameLength(user.username)) {
		throw new CaughtApiException("Wrong length: Username", `A username must fit the range (3-16). Yours is ${len}`)
	}

	if (!isValidUsernameChars(user.username)) {
		throw new CaughtApiException("Invalid Username", "A username can only contain letters, numbers, '_', and '.'");
	}

	if (!isValidPasswordLength(user.password)) {
		throw new CaughtApiException("Wrong length: Password", 'A password must fit the range (5-127)')
	}

	if (!isValidPasswordChars(user.password)) {
		throw new CaughtApiException("Invalid Password", "A password can only contain Alphanumeric Symbols and a select few others.");
	}

	if (!await isUsernameAvailable(user.username)) {
		throw new CaughtApiException(`Name Taken: ${user.username}`, `The username '${user.username}' already exists`)
	}

	const salt = process.env.P_SALT as string;
	const password = await bcrypt.hash(user.password, salt);

	const newUser = await (ctx?.prisma ?? prisma).user.create({
		data: {
			username: user.username,
			password: password,
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