import express, { Request, Response } from 'express'
import cors from 'cors'
import winston from 'winston'
import createUser, { RegisterParams } from './createUser'
import { PrismaClient } from './generated/client'
import 'dotenv/config'
import { loginUser, logoutUser, LoginParams, LogoutParams } from './loginUser'
import fetch from 'node-fetch'

const app = express()
app.use(express.json())
app.use(cors())

export type ExpressAppType = typeof app
export const port = 5000

export const prisma = new PrismaClient()

const loggerConfig = {
	level: 'info',
	format: winston.format.json(),
}

export const logger = winston.createLogger(loggerConfig)

export type ApiError = {
	title: string,
	description: string
}

export type ModelRequest<T = any> = Request<{}, {}, T>
export type ModelResponse = Response

export function buildError(title: string, description: string): ApiError {
	return { title: title, description: description }
}

export interface CaughtApiException {
	name: string,
	message: string
}

export class CaughtApiException {
	constructor(title: string, description?: string) {
		this.name = title;
		this.message = description ?? 'None';
	}
}

if (process.env.NODE_ENV !== 'production') {
	logger.add(new winston.transports.Console({
		format: winston.format.simple()
	}))
}

const loop = async (i: number, cb: () => void) => {
	for (let iter = 0; iter < i; iter++) {
		await cb()
	}
}

SERVER: {
	// do not submit logs or host the server when testing
	if (process.env.NODE_ENV === 'test') break SERVER

	logger.add(new winston.transports.File({ filename: './logs/combined.log' }))
	logger.add(new winston.transports.File({ filename: './logs/error.log' }))

	app.post('/api/register', async (req: ModelRequest<RegisterParams>, res: ModelResponse) => {
		const body = req.body;
		// console.log(req)
		try {
			let user = await createUser(body);
			logger.info(`Created new user: ${user.username} (# ${user.id})`)
			res.send(user)
		} catch (usernameError) {
			console.log(usernameError);

			res.status(usernameError instanceof CaughtApiException ? 400 : 500).send(usernameError)
		}
	})

	app.post('/api/logout', async (req: ModelRequest<LogoutParams>, res: ModelResponse) => {
		const body = req.body;
		try {
			let user = await logoutUser(body.userId);
			res.send(user)
		} catch (usernameError) {
			// console.log(usernameError);
			res.status(usernameError instanceof CaughtApiException ? 400 : 500).send(usernameError)
		}
	})

	app.post('/api/login', async (req: ModelRequest<LoginParams>, res: ModelResponse) => {
		const body = req.body;

		try {
			let user = await loginUser(body.username, body.password);
			res.json(user)
			// console.log(user);
		} catch (loginError) {
			// console.error(loginError)
			res.status(loginError instanceof CaughtApiException ? 400 : 500).send(loginError)
		}
	})

	app.listen(port, async () => {
		await prisma.session.deleteMany() // log out all users on server restart -- NOT FOR PRODUCTION

		console.log("server started " + port);
		TESTS: {
			break TESTS // comment this out when you're testing.
			const user = {
				username: "ymilosevic",
				password: "Niblet16"
			}

			const response = await fetch('http://localhost:5000/api/login', {
				method: 'post',
				body: JSON.stringify(user),
				headers: { 'Content-Type': 'application/json' }
			});
			const data = await response.json();
			console.log('$', data, response.status)

			const response2 = await fetch('http://localhost:5000/api/logout', {
				method: 'post',
				body: JSON.stringify({ userId: '34c39b0d-5f15-464f-aa9b-d6d7d460784d' }),
				headers: { 'Content-Type': 'application/json' }
			});
			const data2 = await response2.json();
			console.log('$', data2, response2.status);
		}
	})
}

export default app;