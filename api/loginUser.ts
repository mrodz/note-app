import * as bcrypt from 'bcrypt'
import { prisma, CaughtApiException, logger } from '.'
import {
	isValidPasswordChars,
	isValidPasswordLength,
	isValidUsernameChars,
	isValidUsernameLength
} from './createUser'
import { Context } from './singleton'

/**
 * REST Parameters (POST Request Body)
 */
export interface LoginParams {
	username: string,
	password: string
}

/**
 * REST Parameters (POST Request Body)
 */
export interface LogoutParams {
	userId: string
}

/**
 * Exception message shorthands.
 */
const messages = {
	usernameError: "Invalid Username",
	passwordError: "Invalid Password",
}

const RecordNotFoundError = "P2025"

export async function logoutUser({ userId }, ctx?: Context) {
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
		if (e?.code === RecordNotFoundError) { // RecordNotFoundError
			throw new CaughtApiException('Account is not signed in')
		} else {
			throw e
		}
	}
}

/**
 * @param username the username in question
 * @returns whether the username is valid (could it exist in the database?)
 */
function discardUsername(username: string) {
	return !isValidUsernameLength(username) || !isValidUsernameChars(username)
}

/**
 * @param password the password in question
 * @returns whether the password is valid (could it exist in the database?)
 */
function discardPassword(password: string) {
	return !isValidPasswordLength(password) || !isValidPasswordChars(password)
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
export async function loginUser({ username, password }, ctx?: Context) {
	// Avoid database lookups if the user could not exist in the first place.
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
			id: true,
			documentCount: true
		}
	})

	// account does not exist if the prisma query returns null.
	if (user === null)
		throw new CaughtApiException(messages.usernameError, "User does not exist")

	const passwordMatches = await bcrypt.compare(password, user.password)

	if (!passwordMatches)
		throw new CaughtApiException(messages.passwordError, 'Password is not valid')

	let sessionId: { id: string }

	if (user.Session !== null) { // they are logged in
		// await logoutUser(user.id)

		sessionId = await (ctx?.prisma ?? prisma).session.update({
			where: {
				userId: user.id
			},
			data: {
				activeSessions: {
					increment: 1
				}
			},
			select: {
				id: true
			}
		})
	} else {
		sessionId = await (ctx?.prisma ?? prisma).session.create({
			data: {
				userId: user.id,
			},
			select: {
				id: true
			}
		})
	}

	// throw new CaughtApiException('This account is already logged in.')

	logger.info(`${username} just logged in -- session id: ${sessionId}`)

	return {
		username: username,
		accountId: user.id,
		sessionId: sessionId.id,
		documentCount: user.documentCount
	}
}