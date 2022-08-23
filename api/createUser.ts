import { prisma, logger, ModelRequest, ModelResponse, CaughtApiException } from '.'
import * as bcrypt from 'bcrypt'
import { Context } from './singleton'

/**
 * Returns wether a given username is available, or taken.
 * @param username the username in question
 * @returns a boolean to await
 */
export async function isUsernameAvailable(username: string): Promise<boolean> {
	return await prisma.user.count({
		where: {
			username: username
		}
	}) === 0
}

/**
 * A username has a valid length if it is at least three and 
 * at most 16 characters long.
 * 
 * @param username the username in question
 * @returns if the username is valid
 */
export function isValidUsernameLength(username: string): boolean {
	return username.length > 2 && username.length <= 16
}

/**
 * A username has valid characters if it consists of solely
 * of alphanumeric characters, or an underscore '_' or period '.'
 * 
 * @param username the username in question
 * @returns if the username is valid
 */
export function isValidUsernameChars(username: string): boolean {
	return /^[a-zA-Z0-9\.\_]+$/.test(username)
}

/**
 * A password has a valid length if it is at least 6 and 
 * at most 128 characters long.
 * 
 * @param password the password in question
 * @returns if the password is valid
 */
export function isValidPasswordLength(password: string): boolean {
	return password.length > 5 && password.length < 128
}

/**
 * A password has valid characters if it consists of solely
 * of alphanumeric characters and a select few special characters:
 * - ~`!@#$%^&*()_+={[}]|:;"'<,>.?\/-
 * 
 * @param username the password in question
 * @returns if the password is valid
 */
export function isValidPasswordChars(password: string): boolean {
	return /^[a-zA-Z0-9~`!@#$%^&*()_\\+={[}\]\|:;"'<,>.\?\/-]+$/.test(password)
}

/**
 * REST Parameters (POST Request Body)
 */
export interface RegisterParams {
	username: string,
	password: string
}

/**
 * Create user from an unsanitized input.
 * @param user A `RegisterParams` user object.
 * @param ctx Database Context. Used for DeepMock testing; if left 
 * blank, defaults to the production database.
 * @returns the user, if one was created succesfully.
 * @throws `CaughtApiException`
 */
export default async function createUser(user: RegisterParams, ctx?: Context) {
	let len = user.username.length

	/// BEGIN sanitizing parameters
	if (!isValidUsernameLength(user.username))
		throw new CaughtApiException("Wrong length: Username", `A username must fit the range (3-16). Yours is ${len}`)

	if (!isValidUsernameChars(user.username))
		throw new CaughtApiException("Invalid Username", "A username can only contain letters, numbers, '_', and '.'")

	if (!isValidPasswordLength(user.password))
		throw new CaughtApiException("Wrong length: Password", 'A password must fit the range (5-127)')

	if (!isValidPasswordChars(user.password))
		throw new CaughtApiException("Invalid Password", "A password can only contain Alphanumeric Symbols and a select few others.")

	if (!await isUsernameAvailable(user.username))
		throw new CaughtApiException(`Name Taken: ${user.username}`, `The username '${user.username}' already exists`)
	/// END sanitizing parameters

	// Generate a random salt for each user. Apply this salt
	// to each password to make it more secure; the `bcrypt`
	// module handles password comparisons without needing to
	// save the salt to the db. 
	const salt = await bcrypt.genSalt(10)
	const password = await bcrypt.hash(user.password, salt)

	const newUser = await (ctx?.prisma ?? prisma).user.create({
		data: {
			username: user.username,
			password: password,
		}
	})

	return newUser
}