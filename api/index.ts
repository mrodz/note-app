import express, { Request, Response } from 'express'
import winston from 'winston'
import registerUser from './createUser'
import { PrismaClient, User } from './generated/client'
import 'dotenv/config'
import fetch from 'node-fetch'

const app = express()
app.use(express.json())

export type ExpressAppType = typeof app
export const port = 5000

export const prisma = new PrismaClient()

export const logger = winston.createLogger({
	level: 'info',
	format: winston.format.json(),
	// defaultMeta: { service: 'note-app' },
	transports: [
		new winston.transports.File({ filename: './logs/error.log', level: 'error' }),
		new winston.transports.File({ filename: './logs/combined.log' })
	]
})

if (process.env.NODE_ENV !== 'production') {
	logger.add(new winston.transports.Console({
		format: winston.format.simple()
	}))
}

app.post('/api/register', registerUser)

export type ApiError = {
	title: string,
	description: string
}

export type ModelRequest<T = any> = Request<{}, {}, T>
export type ModelResponse = Response

export function buildError(title: string, description: string): ApiError {
	return { title: title, description: description }
}

app.listen(port, async () => {
	// const response = await fetch('http://localhost:5000/api/register', {
	// 	method: 'post',
	// 	body: JSON.stringify(user),
	// 	headers: { 'Content-Type': 'application/json' }
	// });

	// const data = await response.json();
	// console.log('.', data);

})

export default app;