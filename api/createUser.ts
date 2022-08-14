import { prisma, logger, buildError, ModelRequest, ModelResponse } from '.'
import * as bcrypt from 'bcrypt'


async function isUsernameAvailable(username: string) {
	return await prisma.user.count({
		where: {
			username: username
		}
	}) === 0
}

function isValidUsernameChars(username: string) {
	return /^[a-zA-Z0-9]+$/.test(username)
}

interface RegisterParams {
	username: string,
	password: string
}

export default async function registerUser(req: ModelRequest<RegisterParams>, res: ModelResponse) {
	const body = req.body;

	if (!isValidUsernameChars(body.username)) {
		res.status(400).json(buildError('Invalid Characters', 'A username can only contain letters and numbers'))
		return
	}

	let len = body.username.length
	if (len > 16) {
		res.status(400).json(buildError('Too Long', `A username can be a maximum of 16 characters long. Yours is ${len}`))
		return
	}

	if (!await isUsernameAvailable(body.username)) {
		res.status(400).json(buildError('Username Taken', `The username '${body.username}' already exists`))
		return
	}

	const salt = process.env.P_SALT as string;
	const password = await bcrypt.hash(body.password, salt);

	const newUser = await prisma.user.create({
		data: {
			username: body.username,
			password: password
		}
	})

	res.send(newUser)
	logger.info(`Created new user: ${newUser.username} (# ${newUser.id})`)
}