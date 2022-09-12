import createUser from "../createUser"
import { User } from "../generated/client"
import { loginUser, logoutUser } from "../loginUser"
import { MockContext, Context, createMockContext } from "../singleton"

let mockContext: MockContext
let context: Context

beforeEach(() => {
	mockContext = createMockContext()
	context = mockContext as unknown as Context
})

test('should sign in as an existing account', async () => {
	const user: User = {
		id: "uuid",
		username: "ddd",
		password: "dddddd",
		createdAt: new Date(),
		documentCount: 0
	}

	mockContext.prisma.user.create.mockResolvedValue(user)
	console.log(await createUser(user, context))

	let c = await loginUser({ username: user.username, password: user.password }, context)
})