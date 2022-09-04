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

export interface DeleteDocParams extends DocumentActionAuth {
	documentId: string
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
		throw new CaughtApiException("Invalid session id")
	}

	return userIdOfSession.userId
}

async function userOwnsDocument(documentId, userId, ctx?: Context): Promise<Document | undefined> {
	try {
		const document = await (ctx?.prisma ?? prisma).document.findUniqueOrThrow({
			where: {
				documentId: documentId
			}
		})

		if (document.userId === userId) return document;

		return void document;
	} catch (e) {
		if (e?.code === 'P2025') { // RecordNotFoundError
			throw new CaughtApiException('Document does not exist for user.')
		} else {
			throw e
		}
	}
}

export async function getDocument({ sessionId, userId, documentId }: DocumentActionAuth & { documentId: string }, ctx?: Context) {
	const userIdOfSession = await validateSession(sessionId, userId)

	const document = await userOwnsDocument(documentId, userId, ctx);

	if (document === undefined)
		throw new CaughtApiException('Access denied', `User ${userId} does not have access to document # ${documentId}`)

	const { preview, ...result } = document
	return result
}

export async function getDocuments({ sessionId, userId }: DocumentActionAuth) {
	const userIdOfSession = await validateSession(sessionId, userId)

	if (!userIdOfSession)
		throw new CaughtApiException("Invalid session ID")

	return await prisma.document.findMany({
		// take: 10,
		where: {
			userId: userIdOfSession
		},
		select: {
			documentId: true,
			title: true,
			lastUpdated: true,
			createdAt: true,
			preview: true
		},
		orderBy: {
			lastUpdated: 'desc'
		}
	})
}

function validateTitle(title: string): boolean {
	return title.length > 0 && title.length < 64 && !/^\s+$/.test(title);
}

export async function renameDocument({ sessionId, userId, title, documentId }: CreateDocParams & DeleteDocParams, ctx?: Context) {
	if (!validateTitle(title))
		throw new CaughtApiException("Invalid title")

	const userIdOfSession = await validateSession(sessionId, userId);

	try {
		// const count = await (ctx?.prisma ?? prisma).document.count({
		// 	where: {
		// 		title: title
		// 	}
		// })

		// if (count !== 0)
		// 	throw new CaughtApiException("A document with this title already exists!");

		console.log('#', documentId);

		const id = await (ctx?.prisma ?? prisma).document.update({
			where: {
				documentId: documentId
				// documentId: documentId,
			},
			data: {
				title: title.replace(/^\s+|\s+$|\s(?=\s)/gi, ''),
				lastUpdated: new Date()
			},
			select: {
				documentId: true,
				title: true
			}
		})

		return id
	} catch (e) {
		if (e?.code === 'P2025') { // RecordNotFoundError
			throw new CaughtApiException('Document does not exist for user.')
		} else {
			throw e
		}
	}
}

export async function deleteDocument({ sessionId, userId, documentId }: DeleteDocParams, ctx?: Context) {
	const userIdOfSession = await validateSession(sessionId, userId);

	try {
		const deletedDocument = await (ctx?.prisma ?? prisma).document.delete({
			where: {
				documentId: documentId
			},
			select: {
				title: true,
				documentId: true
			}
		})

		await (ctx?.prisma ?? prisma).user.update({
			where: {
				id: userIdOfSession
			},
			data: {
				documentCount: {
					decrement: 1
				}
			}
		})

		return deletedDocument
	} catch (e) {
		if (e?.code === 'P2025') { // RecordNotFoundError
			throw new CaughtApiException('Document does not exist for user.')
		} else {
			throw e
		}
	}
}

/**
 * Create a document for a user. Requires a valid `sessionID` to authenticate.
 * @todo
 */
export async function createDocument({ sessionId, userId, title }: CreateDocParams, ctx?: Context) {
	if (!validateTitle(title))
		throw new CaughtApiException("Invalid title")

	const userIdOfSession = await validateSession(sessionId, userId);

	if (!userIdOfSession)
		throw new CaughtApiException("Invalid session ID")

	let count = await (ctx?.prisma ?? prisma).document.findMany({
		where: {
			userId: userId,
			title: title.replace(/^\s+|\s+$|\s(?=\s)/gi, '')
		}
	})

	// if a document exists, the amount returned will not be zero.
	if (count.length !== 0) {
		throw new CaughtApiException("A document with this title already exists!")
	}

	const document = await (ctx?.prisma ?? prisma).document.create({
		data: {
			content: '',
			title: title.replace(/^\s+|\s+$|\s(?=\s)/gi, ''),
			preview: null,
			userId: userIdOfSession
		}
	})

	await (ctx?.prisma ?? prisma).user.update({
		where: {
			id: userIdOfSession
		},
		data: {
			documentCount: {
				increment: 1
			}
		}
	})

	return { documentId: document.documentId };
}