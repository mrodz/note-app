import { CaughtApiException, logger, prisma } from "."
import { isValidUsernameChars, isValidUsernameLength } from "./createUser"
import { Document } from "./generated/client"
import { Context } from "./singleton"

export function catchRecordNotFound<T extends Function>(callback: T, message: string): T {
	return ((...args: any[]) => {
		try {
			return callback(...args)
		} catch (exception) {
			console.log('@', exception?.name);

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
	guestUsername: string
}

type GetMine = {
	mine: boolean
}

type GetGuest = {
	guest: boolean
}

export interface GetDocParams extends DocumentActionAuth {
	include: GetMine | GetGuest | (GetMine & GetGuest)
}

const PRIVILEGE_LEVELS: { [level: number]: string } = {
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
					id: documentId
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
			id: documentId
		}
	})

	if (document?.userId === userId && document !== null) return document

	return void document
}, "Document does not exist for user.")

export const getDocument = catchRecordNotFound(async function ({ sessionId, userId, documentId }: DocumentActionAuth & withDocId, ctx?: Context) {
	await validateSession(sessionId, userId, ctx)

	const { privilege } = await canAccessDocument({ documentId, userId }, ctx)

	const canRead = privilege > 0

	if (privilege === 0) {
		console.log(`user (${userId} attempted to load a document to which they lacked access`)
		return {
			privilege: 0
		}
	}

	await (ctx?.prisma ?? prisma).document.update({
		where: {
			id: documentId
		},
		data: {
			lastUpdated: new Date()
		},
		select: undefined
	})

	const result = await (ctx?.prisma ?? prisma).document.findFirst({
		where: {
			id: documentId
		},
		select: {
			content: canRead,
			id: true,
			guests: canRead && {
				select: {
					id: true,
					username: true
				},
				orderBy: {
					username: 'asc'
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
}, "Not Found")

export const getDocuments = catchRecordNotFound(async function ({ sessionId, userId, include }: GetDocParams, ctx?: Context) {
	const user = await validateSession(sessionId, userId, ctx)

	const selectDocument = {
		select: {
			id: true,
			title: true,
			lastUpdated: true,
			createdAt: true,
			preview: true
		}
	}

	let request: Object | undefined = {}
	let c = 0

	if ('mine' in include && include.mine) request['documents'] = ++c && selectDocument
	if ('guest' in include && include.guest) request['guestDocuments'] = ++c && selectDocument
	if (c === 0) request = undefined

	console.log('iii', JSON.stringify(include));


	const query = await (ctx?.prisma ?? prisma).user.findFirst({
		where: {
			id: user.id
		},
		select: request
	})

	if (query === null)
		throw new CaughtApiException('Not found')

	console.log(query)

	return query
	// return await (ctx?.prisma ?? prisma).document.findMany({
	// 	// take: 10,
	// 	where: {
	// 		userId: user.id
	// 	},
	// 	select: {
	// 		id: true,
	// 		title: true,
	// 		lastUpdated: true,
	// 		createdAt: true,
	// 		preview: true
	// 	},
	// 	orderBy: {
	// 		lastUpdated: 'desc'
	// 	}
	// })
}, 'Invalid user id')

function validateTitle(title: string): boolean {
	return title.length > 0 && title.length < 64 && !/^\s+$/.test(title)
}

export const renameDocument = catchRecordNotFound(async function ({ sessionId, userId, title, documentId }: CreateDocParams & DeleteDocParams, ctx?: Context) {
	if (!validateTitle(title))
		throw new CaughtApiException("Invalid title")

	const userIdOfSession = await validateSession(sessionId, userId, ctx)

	if (!await userOwnsDocument(documentId, userIdOfSession, ctx)) {
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
			id: documentId
		},
		data: {
			title: title.replace(/^\s+|\s+$|\s(?=\s)/gi, ''),
			lastUpdated: new Date()
		},
		select: {
			id: true,
			title: true
		}
	})

	return id
}, "Document does not exist for user")

export const removeShareAccess = catchRecordNotFound(async ({ userId, sessionId, documentId, guestUsername }: ShareDocParams, ctx?: Context) => {
	const thisUser = await validateSession(sessionId, userId, ctx)

	if (!await userOwnsDocument(documentId, thisUser.id, ctx))
		throw new CaughtApiException("Access denied")

	if (!isValidUsernameLength(guestUsername) || !isValidUsernameChars(guestUsername))
		throw new CaughtApiException("Illegal username")

	const idFromGuestUsername = await (ctx?.prisma ?? prisma).user.findFirst({
		where: {
			username: guestUsername
		},
		select: {
			id: true
		}
	})

	if (idFromGuestUsername === null)
		throw new CaughtApiException(`Account '${guestUsername}' does not exist`)

	if (idFromGuestUsername.id === userId)
		throw new CaughtApiException('Cannot share to yourself')

	const isNotShared = await (ctx?.prisma ?? prisma).user.count({
		where: {
			AND: {
				id: idFromGuestUsername.id,
				guestDocuments: {
					some: {
						id: documentId
					}
				}
			}
		}
	}) === 0

	if (isNotShared)
		throw new CaughtApiException(`Account ${guestUsername} is not a guest`)

	// try {
	await (ctx?.prisma ?? prisma).document.update({
		where: {
			id: documentId
		},
		data: {
			guests: {
				disconnect: {
					id: idFromGuestUsername.id
				}
			}
		},
		select: {
			_count: true
		}
	})

	return {
		username: guestUsername,
		id: idFromGuestUsername.id
	}

}, 'Not found')

export const shareDocument = catchRecordNotFound(async function ({ userId, sessionId, documentId, guestUsername }: ShareDocParams, ctx?: Context) {

	const thisUser = await validateSession(sessionId, userId, ctx)

	if (!await userOwnsDocument(documentId, thisUser.id, ctx))
		throw new CaughtApiException("Access denied")

	if (!isValidUsernameLength(guestUsername) || !isValidUsernameChars(guestUsername))
		throw new CaughtApiException("Illegal username")

	const idFromGuestUsername = await (ctx?.prisma ?? prisma).user.findFirst({
		where: {
			username: guestUsername
		},
		select: {
			id: true
		}
	})

	if (idFromGuestUsername === null)
		throw new CaughtApiException(`Account '${guestUsername}' does not exist`)

	const isAlreadyShared = await (ctx?.prisma ?? prisma).user.count({
		where: {
			AND: {
				id: idFromGuestUsername.id,
				guestDocuments: {
					some: {
						id: documentId
					}
				}
			}
		}
	}) !== 0

	if (isAlreadyShared)
		throw new CaughtApiException(`Account ${guestUsername} is already a guest`)

	// try {
	await (ctx?.prisma ?? prisma).document.update({
		where: {
			id: documentId
		},
		data: {
			guests: {
				connect: {
					id: idFromGuestUsername.id
				}
			}
		},
		select: {
			_count: true
		}
	})

	return {
		username: guestUsername,
		id: idFromGuestUsername.id
	}
	// } catch (e) {
	// 	console.log(e)
	// }

}, "Not found")

export const deleteDocument = catchRecordNotFound(async function ({ sessionId, userId, documentId }: DeleteDocParams, ctx?: Context) {
	const user = await validateSession(sessionId, userId, ctx)

	if (!await userOwnsDocument(documentId, userId, ctx)) {
		throw new CaughtApiException("Access denied")
	}

	const deletedDocument = await (ctx?.prisma ?? prisma).document.delete({
		where: {
			id: documentId
		},
		select: {
			title: true,
			id: true
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
	if (newContent.length >= 16382)
		throw new CaughtApiException("file too big")

	const user = await validateSession(sessionId, userId, ctx)

	if (!await userOwnsDocument(documentId, user.id, ctx))
		throw new CaughtApiException("Access denied")

	const id = await (ctx?.prisma ?? prisma).document.update({
		where: {
			id: documentId
		},
		data: {
			content: newContent,
			preview: newContent.substring(0, Math.min(newContent.length, 127)),
			lastUpdated: new Date()
		},
		select: {
			id: true
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

	return { documentId: document.id }
}, 'Invalid user id')