const request = require('supertest');
const app = require('../../src/server/index');

describe('Hello World API', () => {
  test('GET /hello_world should return 200 and correct JSON', async () => {
    const response = await request(app)
      .get('/hello_world')
      .expect(200);
    
    expect(response.body).toEqual({ hello: "world" });
    expect(response.headers['content-type']).toMatch(/json/);
  });
  
  test('GET /hello_world should respond quickly', async () => {
    const start = Date.now();
    await request(app).get('/hello_world');
    const duration = Date.now() - start;
    
    expect(duration).toBeLessThan(100); // Should respond in under 100ms
  });
});
