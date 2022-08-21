import createUser from "../createUser";
import { loginUser, logoutUser } from "../loginUser";
import { MockContext, Context, createMockContext } from "../singleton";

let mockContext: MockContext;
let context: Context;

beforeEach(() => {
	mockContext = createMockContext();
	context = mockContext as unknown as Context;
})

test('should sign in as an existing account', async () => {
	const user = {
		id: "uuid",
		username: "ddd",
		password: "dddddd",
		createdAt: new Date()
	}

	mockContext.prisma.user.create.mockResolvedValue(user)
	console.log(await createUser(user, context))

	let c = await loginUser(user.username, user.password, context)
	console.log(c);

	// await expect(loginUser("aaa", "aaaaaa", context)).resolves.toHaveProperty('sessionId')

	// await expect(logoutUser())
	// const response2 = await fetch('http://localhost:5000/api/logout', {
	// 	method: 'post',
	// 	body: JSON.stringify({ userId: data.accountId }),
	// 	headers: { 'Content-Type': 'application/json' }
	// });

	// const data2 = await response2.json();

	// expect(response2.status).toBe(200)
	// expect(data2).toHaveProperty('deletedSessionId', data.sessionId)
})