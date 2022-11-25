import express, { Request, Response } from 'express'
import cors from 'cors'
import winston from 'winston'
import { PrismaClient } from './generated/client'
import 'dotenv/config'

// ENDPOINTS
import createUser, { RegisterParams } from './createUser'
import { loginUser, logoutUser, LoginParams, LogoutParams } from './loginUser'
import { canAccessDocument, CreateDocParams, createDocument, DeleteDocParams, deleteDocument, DocumentActionAuth, getDocument, getDocuments, removeShareAccess, renameDocument, shareDocument, writeDocContent, WriteDocContentParams } from './documentActions'
import { Context } from './singleton'

const app = express()   // create ExpressJS app
app.use(express.json()) // allow POST requests to take JSON inputs.
app.use(cors())         // allow cross-origin requests.

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

// Used in endpoint implementations
export type ModelRequest<T = any> = Request<{}, {}, T>
export type ModelResponse = Response

export function buildError(title: string, description: string): ApiError {
	return { title: title, description: description }
}

/// BEGIN CaughtApiException
export interface CaughtApiException {
	/**
	 * Most important message; the title/cause of the exception
	 */
	name: string,
	/**
	 * Exception details/extra info.
	 */
	message: string,
	/**
	 * HTTP response code.
	 */
	code: number
}

export class CaughtApiException {
	constructor(title: string, description?: string, code?: number) {
		this.name = title
		this.message = description ?? 'None'
		this.code = code ?? 400
	}
}
/// END CaughtApiException

// Only log to console if we're not in production.
if (process.env.NODE_ENV !== 'production') {
	logger.add(new winston.transports.Console({
		format: winston.format.simple()
	}))
}

/**
 * Utility function
 */
export const loop = async (i: number, cb: () => void) => {
	for (let iter = 0; iter < i; iter++) {
		await cb()
	}
}

function wrapRestFunction<T = any, R = any>(restFunction: (body: T, ctx?: Context) => Promise<R>) {
	return async function (req: ModelRequest<T>, res: ModelResponse) {
		const body = req.body
		try {
			let methodResponse = await restFunction(body)
			res.send(methodResponse)
		} catch (error) {
			logger.error(error)
			res.status(error?.code ?? 500).send(error)
		}
	}
}

/**
 * @todo - https://www.prisma.io/docs/concepts/components/prisma-client/transactions
 */
SERVER: {
	// do not submit logs or host the server when testing
	if (process.env.NODE_ENV === 'test') break SERVER

	logger.add(new winston.transports.File({ filename: './logs/combined.log' }))
	logger.add(new winston.transports.File({ filename: './logs/error.log' }))

	/// BEGIN Endpoints
	app.post('/api/register', wrapRestFunction(createUser))
	app.post('/api/logout', wrapRestFunction(logoutUser))
	app.post('/api/login', wrapRestFunction(loginUser))
	app.post('/api/doc/all', wrapRestFunction(getDocuments))
	app.post('/api/doc/create', wrapRestFunction(createDocument))
	app.post('/api/doc/rename', wrapRestFunction(renameDocument))
	app.post('/api/doc/get', wrapRestFunction(getDocument))
	app.post('/api/doc/delete', wrapRestFunction(deleteDocument))
	app.post('/api/doc/write', wrapRestFunction(writeDocContent))
	app.post('/api/doc/share', wrapRestFunction(shareDocument))
	app.post('/api/doc/access', wrapRestFunction(canAccessDocument))
	app.post('/api/doc/deshare', wrapRestFunction(removeShareAccess))
	/// END Endpoints

	// Hoist the app
	app.listen(port, async () => {
		logger.info("server started on port " + port)
	})
}

export default app