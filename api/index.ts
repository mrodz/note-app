import express, { Request, Response } from 'express'
import cors from 'cors'
import winston from 'winston'
import createUser, { RegisterParams, registerUser, UsernameError } from './createUser'
import { PrismaClient } from './generated/client'
import 'dotenv/config'

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

if (process.env.NODE_ENV !== 'production') {
	logger.add(new winston.transports.Console({
		format: winston.format.simple()
	}))
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
			res.status(usernameError instanceof UsernameError ? 400 : 500).send(usernameError)
		}
	})

	app.listen(port, async () => {
		console.log("server started " + port);

		// const response = await fetch('http://localhost:5000/api/register', {
		// 	method: 'post',
		// 	body: JSON.stringify(user),
		// 	headers: { 'Content-Type': 'application/json' }
		// });

		// const data = await response.json();
		// console.log('.', data);

	})
}

export default app;