import { MockContext, Context, createMockContext } from "../singleton";
import createUser, { isValidUsernameChars, isValidUsernameLength } from "../createUser";

let mockContext: MockContext;
let context: Context;

beforeEach(() => {
  mockContext = createMockContext();
  context = mockContext as unknown as Context;
})

test('should create new user', async () => {
  const user = {
    id: 'UUID-here',
    username: 'Loremp',
    password: 'julio22',
    createdAt: new Date('2023-08-14T06:51:03.404Z')
  }

  mockContext.prisma.user.create.mockResolvedValue(user)
  await expect(createUser(user, context)).resolves.toHaveProperty('username', 'Loremp')
})

test('should not create duplicate account (so long as mateo\'s account exists)', async () => {
  const user = {
    id: 'UUID-here',
    username: 'mateo',
    password: '1234',
    createdAt: new Date('2023-08-14T06:51:03.404Z')
  }

  mockContext.prisma.user.create.mockResolvedValue(user)
  await expect(createUser(user, context)).rejects.toHaveProperty("name", "Name Taken")
})

test('all usernames should have valid lengths', () => {
  expect(isValidUsernameLength('MtRm1')).toBe(true);
  expect(isValidUsernameLength('LGamer21')).toBe(true);
  expect(isValidUsernameLength('Davewonder16')).toBe(true);
})

test('all usernames should have valid characters', () => {
  expect(isValidUsernameChars('aBcDeFgHiJkLmNoPqRsTuVwXyZ')).toBe(true)
  expect(isValidUsernameChars('TapatíoDealer')).toBe(false)
  expect(isValidUsernameChars('äëïöüáéíóú')).toBe(false)
  expect(isValidUsernameChars('yeg$')).toBe(false)
  expect(isValidUsernameChars('dylab')).toBe(true)
  expect(isValidUsernameChars('Mr.Mister')).toBe(true)
})