import { PrismaClient } from "./generated/client"
import { forEach, registerScript, runScript } from "./adminimpl"
import promptUnconfigured from "prompt-sync"

// SETUP
const prompt = promptUnconfigured()
const prisma = new PrismaClient()

registerScript("Delete user", async () => {
	const username = prompt('Enter username: ')

	const result = await prisma.user.delete({
		where: {
			username: username
		}
	})

	console.log(`Deleted user: ${JSON.stringify(result)}`)
})

registerScript("Get users", async () => {
	console.log(await prisma.user.findMany())
})

registerScript("Get documents", async () => {
	console.log(await prisma.document.findMany())
})

registerScript("Get sessions", async () => {
	console.log(await prisma.session.findMany())
})

registerScript("Delete document", async () => {
	const username = prompt("Enter account in which to search: ")
	console.log(`${username}'s documents -\nTITLE\t\t\tPREVIEW`)
	for (const { title, preview } of (await prisma.user.findFirstOrThrow({
		where: {
			username: username,
		},
		select: {
			documents: {
				select: {
					title: true,
					preview: true
				}
			}
		}
	})).documents) {
		console.log(title, '\t\t', preview)
	}

	const title = prompt('\nEnter title of the document to delete: ')

	const [{ id }] = (await prisma.user.findFirstOrThrow({
		where: {
			username: username,
		},
		select: {
			documents: {
				where: {
					title: title
				},
				select: {
					id: true
				},

			}
		}
	})).documents

	console.log('Deleted document: ', JSON.stringify(await prisma.document.delete({
		where: {
			id: id
		}
	})))
})

forEach((key, name) => {
	console.log(`[${key}] ${name}`)
})

const action = prompt("Enter an action: ")

const code = runScript(action)