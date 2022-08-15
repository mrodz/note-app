import { PrismaClient } from "./generated/client";
// import { mockDeep, mockReset, DeepMockProxy } from "jest-mock-extended"
import { mockDeep, DeepMockProxy } from "jest-mock-extended";

export type Context = {
	prisma: PrismaClient
}

export type MockContext = {
	prisma: DeepMockProxy<PrismaClient>
}

export const createMockContext = (): MockContext => {
	return {
		prisma: mockDeep<PrismaClient>()
	}
}

// import { prisma } from ".";

// jest.mock('./index', () => ({
// 	__esModule: true,
// 	default: mockDeep<PrismaClient>(),
// }))

// export const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>


// beforeEach(() => {
// 	console.log(prismaMock);

// 	mockReset(prismaMock)
// })

