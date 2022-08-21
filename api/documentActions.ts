import { CaughtApiException, prisma } from ".";
import { Context } from "./singleton";

export interface CreateDocParams {
	sessionId: string,
	userId: string,
	title: string
}

export async function createDocument({ sessionId, userId, title }: CreateDocParams, ctx?: Context) {
	const userIdOfSession = await prisma.session.findUnique({
		where: {
			id: sessionId
		},
		select: {
			userId: true
		}
	})

	if (userIdOfSession === null || userIdOfSession?.userId !== userId) {
		throw new CaughtApiException("Invalid session ID")
	}

	const document = {
		content: '',
		title: title,
	}

	console.log(userId);

	let count = await prisma.document.findMany({
		where: {
			userId: userId,
			title: title
		}
	})

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
		},
		select: {
			documents: true
		}
	})

	return documents
}