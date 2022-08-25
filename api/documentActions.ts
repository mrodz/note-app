import { CaughtApiException, prisma } from ".";
import { Document } from "./generated/client";
import { Context } from "./singleton";

export interface DocumentActionAuth {
	sessionId: string,
	userId: string
}

/**
 * REST Parameters (POST Request Body)
 */
export interface CreateDocParams extends DocumentActionAuth {
	title: string
}

export async function validateSession(sessionId, userId) {
	const userIdOfSession = await prisma.session.findUnique({
		where: {
			id: sessionId
		},
		select: {
			userId: true
		}
	})

	if (userIdOfSession === null || userIdOfSession?.userId !== userId) {
		return false
	}

	return userIdOfSession.userId
}

export async function getDocuments({ sessionId, userId }: DocumentActionAuth): Promise<Document[]> {
	const userIdOfSession = await validateSession(sessionId, userId);

	if (!userIdOfSession)
		throw new CaughtApiException("Invalid session ID")

	return await prisma.document.findMany({
		take: 10,
		where: {
			userId: userIdOfSession
		},
		orderBy: {
			lastUpdated: 'desc'
		}
	})
}

/**
 * Create a document for a user. Requires a valid `sessionID` to authenticate.
 * @todo
 */
export async function createDocument({ sessionId, userId, title }: CreateDocParams, ctx?: Context) {
	const userIdOfSession = await validateSession(sessionId, userId);

	if (!userIdOfSession)
		throw new CaughtApiException("Invalid session ID")


	const document = {
		content: '',
		title: title,
	}

	let count = await prisma.document.findMany({
		where: {
			userId: userId,
			title: title
		}
	})

	// if a document exists, the amount returned will not be zero.
	if (count.length !== 0) {
		throw new CaughtApiException("A document with this title already exists!")
	}

	const documents = await prisma.user.update({
		where: {
			id: userId
		},
		data: {
			documents: {
				create: document
			},
			documentCount: {
				increment: 1
			}
		},
		select: {
			documents: true
		}
	})

	return documents // fixme
}