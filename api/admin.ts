import { PrismaClient } from "./generated/client"
const prisma = new PrismaClient()
const prompt = require('prompt-sync')()

const actions: {
	[id: number]: {
		name: string,
		code: () => void
	}
} = {
	0: {
		name: "Delete user",
		code: async () => {
			const username = prompt('Enter username: ')

			const result = await prisma.user.delete({
				where: {
					id: '183d705d-4abb-4b62-8a4e-bc338cc1ca88'
				}
			})

			console.log(`Deleted user: ${JSON.stringify(result)}`);

		}
	},
	1: {
		name: "Get users",
		code: async () => {
			console.log(await prisma.user.findMany())
		}
	},
	2: {
		name: "Get documents",
		code: async () => {
			console.log(await prisma.document.findMany())
		}
	},
	3: {
		name: "Delete document",
		code: async () => {
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
		}
	},
	4: {
		name: "Get sessions",
		code: async () => {
			console.log(await prisma.session.findMany())
		}
	}
}

for (const key in actions) {
	console.log(`[${key}] ${actions[key].name}`);

}
const action = prompt("Enter an action: ")
actions[action].code()