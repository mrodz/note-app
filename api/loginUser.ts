import * as bcrypt from 'bcrypt'
import { prisma, CaughtApiException } from '.'
import {
	isUsernameAvailable,
	isValidPasswordChars,
	isValidPasswordLength,
	isValidUsernameChars,
	isValidUsernameLength
} from './createUser'
import { Context } from './singleton'

export interface LoginParams {
	username: string,
	password: string
}

const messages = {
	usernameError: "Invalid Username",
	passwordError: "Invalid Password",
}

function discardUsername(username: string) {
	return !isValidUsernameLength(username) || !isValidUsernameChars(username)
}

function discardPassword(password: string) {
	return !isValidPasswordLength(password) || !isValidPasswordChars(password)
}

export default async function loginUser(username: string, password: string, ctx?: Context) {
	// Avoid database lookup if the user could not exist in the first place.
	if (discardUsername(username))
		throw new CaughtApiException(messages.usernameError, 'Username is not valid')

	if (discardPassword(password))
		throw new CaughtApiException(messages.passwordError, 'Password is not valid')

	const user = await (ctx?.prisma ?? prisma).user.findUnique({
		where: {
			username: username
		},
		select: {
			password: true,
			Session: true,
			id: true
		}
	})

	// account does not exist if the prisma query returns null.
	if (user === null)
		throw new CaughtApiException(messages.usernameError, "User does not exist")

	if (user.Session !== null)
		throw new CaughtApiException('This account is already logged in.')

	const passwordMatches = await bcrypt.compare(password, user.password)

	if (!passwordMatches)
		throw new CaughtApiException(messages.passwordError, 'Password is not valid');

	const session = await (ctx?.prisma ?? prisma).session.create({
		data: {
			userId: user.id,
		}
	})

	console.log(session);


	return {
		// sessionId: session
	}
}