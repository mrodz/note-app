import { CaughtApiException, prisma } from "."
import { Document } from "./generated/client"
import { Context } from "./singleton"

export function catchRecordNotFound<T extends Function>(callback: T, message: string): T {
	return ((...args: any[]) => {
		try {
			return callback(...args)
		} catch (exception) {
			if (exception?.code === 'P2025' || exception?.name === "NotFoundError") { // RecordNotFoundError
				throw new CaughtApiException(message)
			} else {
				throw exception
			}
		}
	}) as unknown as T
}

export type withDocId = { documentId: string }

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

export interface WriteDocContentParams extends DocumentActionAuth, withDocId {
	newContent: string
}

export interface ShareDocParams extends DocumentActionAuth, withDocId {
	guestUserId: string
}

const PRIVILEGE_LEVELS = {
	0: 'NONE',
	1: 'GUEST',
	2: 'OWNER'
}

type canAccessDocumentReturns = {
	accessible: boolean,
	privilege: keyof typeof PRIVILEGE_LEVELS
}

export const canAccessDocument = catchRecordNotFound(async function ({ userId, documentId }, ctx?: Context): Promise<canAccessDocumentReturns> {
	if (await userOwnsDocument(documentId, userId, ctx)) return { accessible: true, privilege: 2 }

	const result = await (ctx?.prisma ?? prisma).user.count({
		where: {
			id: userId,
			guestDocuments: {
				some: {
					documentId: documentId
				}
			}
		}
	}) === 1

	return {
		accessible: result,
		privilege: result ? 1 : 0
	}
}, "Not found")

export const validateSession = catchRecordNotFound(async function (sessionId, userId, ctx?: Context) {
	const userOfSession = await (ctx?.prisma ?? prisma).session.findFirst({
		where: {
			id: sessionId
		},
		select: {
			User: true
		}
	})

	if (userOfSession === null || userOfSession?.User.id !== userId) {
		throw new CaughtApiException("Invalid session id")
	}

	return userOfSession.User
}, "Invalid session id")

const userOwnsDocument = catchRecordNotFound(async function (documentId, userId, ctx?: Context): Promise<Document | undefined> {
	const document = await (ctx?.prisma ?? prisma).document.findFirst({
		where: {
			documentId: documentId
		}
	})

	if (document?.userId === userId && document !== null) return document

	return void document
}, "Document does not exist for user.")

export async function getDocument({ sessionId, userId, documentId }: DocumentActionAuth & withDocId, ctx?: Context) {
	await validateSession(sessionId, userId, ctx)

	const { privilege } = await canAccessDocument({ documentId, userId }, ctx)

	const canRead = privilege > 0
	const canWrite = privilege === 2

	if (privilege === 0) return {
		privilege: 0
	}

	const result = await (ctx?.prisma ?? prisma).document.findFirst({
		where: {
			documentId: documentId
		},
		select: {
			content: canRead,
			documentId: true,
			guests: canRead && {
				select: {
					id: true,
					username: true
				}
			},
			lastUpdated: canRead,
			title: canRead,
			User: canRead && {
				select: {
					id: true,
					username: true
				}
			}
		}
	})

	return {
		privilege: privilege,
		...result
	}
}

export const getDocuments = catchRecordNotFound(async function ({ sessionId, userId }: DocumentActionAuth, ctx?: Context) {
	const user = await validateSession(sessionId, userId, ctx)

	return await (ctx?.prisma ?? prisma).document.findMany({
		// take: 10,
		where: {
			userId: user.id
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
}, 'Invalid user id')

function validateTitle(title: string): boolean {
	return title.length > 0 && title.length < 64 && !/^\s+$/.test(title)
}

export const renameDocument = catchRecordNotFound(async function ({ sessionId, userId, title, documentId }: CreateDocParams & DeleteDocParams, ctx?: Context) {
	if (!validateTitle(title))
		throw new CaughtApiException("Invalid title")

	const userIdOfSession = await validateSession(sessionId, userId, ctx)

	if (!await userOwnsDocument(documentId, userId, ctx)) {
		throw new CaughtApiException("Access denied")
	}

	const count = await (ctx?.prisma ?? prisma).document.count({
		where: {
			title: title
		}
	})

	if (count !== 0)
		throw new CaughtApiException("A document with this title already exists!")

	console.log('#', documentId)

	const id = await (ctx?.prisma ?? prisma).document.update({
		where: {
			documentId: documentId
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
}, "Document does not exist for user")

export const shareDocument = catchRecordNotFound(async function ({ userId, sessionId, documentId, guestUserId }: ShareDocParams, ctx?: Context) {
	const thisUser = await validateSession(sessionId, userId, ctx)
	if (!await userOwnsDocument(documentId, userId, ctx)) {
		throw new CaughtApiException("Access denied")
	}

	return await (ctx?.prisma ?? prisma).document.update({
		where: {
			documentId: documentId
		},
		data: {
			guests: {
				connect: {
					id: guestUserId
				}
			}
		}
	})

}, "Not found")

export const deleteDocument = catchRecordNotFound(async function ({ sessionId, userId, documentId }: DeleteDocParams, ctx?: Context) {
	const user = await validateSession(sessionId, userId, ctx)

	if (!await userOwnsDocument(documentId, userId, ctx)) {
		throw new CaughtApiException("Access denied")
	}

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
			id: user.id
		},
		data: {
			documentCount: {
				decrement: 1
			}
		}
	})

	return deletedDocument
}, 'Document does not exist for user')

export const writeDocContent = catchRecordNotFound(async function ({ sessionId, userId, documentId, newContent }: WriteDocContentParams, ctx?: Context) {
	const user = await validateSession(sessionId, userId, ctx)

	if (!await userOwnsDocument(documentId, user.id, ctx)) {
		throw new CaughtApiException("Access denied")
	}

	const id = await (ctx?.prisma ?? prisma).document.update({
		where: {
			documentId: documentId
		},
		data: {
			content: newContent,
			preview: newContent.substring(0, Math.min(newContent.length, 127)),
			lastUpdated: new Date()
		},
		select: {
			documentId: true
		}
	})

	return id
}, 'Invalid document id')

/**
 * Create a document for a user. Requires a valid `sessionID` to authenticate.
 * @todo
 */
export const createDocument = catchRecordNotFound(async function ({ sessionId, userId, title }: CreateDocParams, ctx?: Context) {
	if (!validateTitle(title))
		throw new CaughtApiException("Invalid title")

	const user = await validateSession(sessionId, userId, ctx)

	let count = await (ctx?.prisma ?? prisma).document.count({
		where: {
			userId: userId,
			title: title.replace(/^\s+|\s+$|\s(?=\s)/gi, '')
		}
	})

	// if a document exists, the amount returned will not be zero.
	if (count !== 0) {
		throw new CaughtApiException("A document with this title already exists!")
	}

	const document = await (ctx?.prisma ?? prisma).document.create({
		data: {
			content: '',
			title: title.replace(/^\s+|\s+$|\s(?=\s)/gi, ''),
			preview: null,
			userId: user.id
		}
	})

	await (ctx?.prisma ?? prisma).user.update({
		where: {
			id: user.id
		},
		data: {
			documentCount: {
				increment: 1
			}
		}
	})

	return { documentId: document.documentId }
}, 'Invalid user id')