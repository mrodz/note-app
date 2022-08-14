import express from 'express'
import winston from 'winston'
import { registerUser } from './createUser'
import { PrismaClient, User } from './generated/client'
import 'dotenv/config'
import fetch from 'node-fetch'
import * as bcrypt from 'bcrypt'

const saltRounds = 10;
const myPlaintextPassword = 'scOUT_300001625$#';

// console.log(`salt = ${process.env['P_SALT']}`);

(async () => {
	// Technique 1 (generate a salt and hash on separate function calls):
	const salt = process.env['P_SALT'] as string;
	console.log(salt);

	const hash = await bcrypt.hash(myPlaintextPassword, salt);
	console.log(`hash1 = ${hash}`);

	// Store hash in your password DB.

	// Technique 2 (auto-gen a salt and hash):
	const hash2 = await bcrypt.hash(myPlaintextPassword, saltRounds);
	console.log(`hash2 = ${hash2}`);

	// Store hash in your password DB.
});

const app = express()
app.use(express.json())

export type ExpressAppType = typeof app
export const port = 5000

export const prisma = new PrismaClient()

export const logger = winston.createLogger({
	level: 'info',
	format: winston.format.json(),
	defaultMeta: { service: 'user-service' },
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

registerUser(app)

const user = {
	username: 'Mateo',
	password: '1234'
};

type ApiError = {
	title: string,
	description: string
}

export function buildError(title: string, description: string): ApiError {
	return { title: title, description: description }
}

app.listen(port, async () => {
	const response = await fetch('http://localhost:5000/api/register', {
		method: 'post',
		body: JSON.stringify(user),
		headers: { 'Content-Type': 'application/json' }
	});

	const data = await response.json();
	console.log('.', data);

})

