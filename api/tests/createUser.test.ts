import request from 'supertest'
import app from '..'

describe('first', () => {
  test('s', async () => {
    const response = await request(app).post('/api/register').send({
      username: 'mrod',
      password: '1625'
    })

    console.log(response.body);

    expect(response.status).toBe(200)
  })
})