import { PrismaClient } from "./generated/client"
import { mockDeep, DeepMockProxy } from "jest-mock-extended"

/**
 * Context which holds a reference to a `PrismaClient`.
 */
export type Context = {
	/**
	 * The client.
	 */
	prisma: PrismaClient
}

/**
 * A context to mock a Prisma Client.
 * ## Especially useful when testing!
 */
export type MockContext = {
	/**
	 * The mocked client.
	 */
	prisma: DeepMockProxy<PrismaClient>
}

/**
 * Factory method to build a MockContext
 * @returns a `MockContext`
 */
export const createMockContext = (): MockContext => {
	return {
		prisma: mockDeep<PrismaClient>()
	}
}