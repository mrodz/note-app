import { MockContext, Context, createMockContext } from "../singleton"
import createUser, { isValidPasswordChars, isValidPasswordLength, isValidUsernameChars, isValidUsernameLength } from "../createUser"
import { User } from "../generated/client"

let mockContext: MockContext
let context: Context

beforeEach(() => {
  mockContext = createMockContext()
  context = mockContext as unknown as Context
})

test('should create new user', async () => {
  const user: User = {
    id: 'UUID-here',
    username: 'Loremp',
    password: 'julio22',
    createdAt: new Date('2023-08-14T06:51:03.404Z'),
    documentCount: 0,
  }

  mockContext.prisma.user.create.mockResolvedValue(user)
  await expect(createUser(user, context)).resolves.toHaveProperty('username', 'Loremp')
})

test('should not create duplicate account (so long as mateo\'s account exists)', async () => {
  const user: User = {
    id: 'UUID-here',
    username: 'mateo',
    password: '123456',
    createdAt: new Date('2023-08-14T06:51:03.404Z'),
    documentCount: 0
  }

  mockContext.prisma.user.create.mockResolvedValue(user)
  await expect(createUser(user, context)).rejects.toHaveProperty("name", "Name Taken: mateo")
})

test('all usernames should have valid lengths', () => {
  expect(isValidUsernameLength('MtRm1')).toBe(true)
  expect(isValidUsernameLength('LGamer21')).toBe(true)
  expect(isValidUsernameLength('Davewonder16')).toBe(true)
})

test('all usernames should have valid characters', () => {
  expect(isValidUsernameChars('aBcDeFgHiJkLmNoPqRsTuVwXyZ')).toBe(true)
  expect(isValidUsernameChars('TapatíoDealer')).toBe(false)
  expect(isValidUsernameChars('äëïöüáéíóú')).toBe(false)
  expect(isValidUsernameChars('yeg$')).toBe(false)
  expect(isValidUsernameChars('dylab')).toBe(true)
  expect(isValidUsernameChars('Mr.Mister')).toBe(true)
})

test('all passwords should have valid characters', () => {
  expect(isValidPasswordChars('aBcDeFgHiJkLmNoPqRsTuVwXyZ')).toBe(true)
  expect(isValidPasswordChars('TapatíoDealer')).toBe(false)
  expect(isValidPasswordChars('äëïöüáéíóú')).toBe(false)
  expect(isValidPasswordChars('yeg$')).toBe(true)
  expect(isValidPasswordChars('dylab')).toBe(true)
  expect(isValidPasswordChars('Mr.Mister')).toBe(true)
  expect(isValidPasswordChars('BV`9Yf~sE#pcP$Z.GHgF')).toBe(true)
  expect(isValidPasswordLength('')).toBe(false)
})