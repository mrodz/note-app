import * as bcrypt from 'bcrypt'
import { prisma, CaughtApiException, logger } from '.'
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

export interface LogoutParams {
	userId: string
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

export async function logoutUser(userId: string, ctx?: Context) {
	try {
		const signedOutSession = await (ctx?.prisma ?? prisma).session.delete({
			where: {
				userId: userId
			}
		})

		logger.info(`ID ${userId} just logged out`)

		return {
			userId: signedOutSession.userId,
			deletedSessionId: signedOutSession.id
		}
	} catch (e) {
		if (e?.code === 'P2025') { // RecordNotFoundError
			throw new CaughtApiException('Account is not signed in')
		} else {
			throw e
		}
	}
}

/**
 * Order of checks:
 * 1. Make sure the user fields are valid in the first place, 
 *   to avoid expensive computations.
 * 2. Reject on non-existant user.
 * 3. Reject on invalid password.
 * 4. Reject on user already signed in. 
 * @param username 
 * @param password 
 * @param ctx 
 * @returns 
 */
export async function loginUser(username: string, password: string, ctx?: Context) {
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

	const passwordMatches = await bcrypt.compare(password, user.password)

	if (!passwordMatches)
		throw new CaughtApiException(messages.passwordError, 'Password is not valid');

	if (user.Session !== null)
		throw new CaughtApiException('This account is already logged in.')

	const session = await (ctx?.prisma ?? prisma).session.create({
		data: {
			userId: user.id,
		}
	})

	logger.info(`${username} just logged in -- session id: ${session.id}`)

	return {
		username: username,
		accountId: user.id,
		sessionId: session.id
	}
}