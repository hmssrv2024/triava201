import request from 'supertest';
import express from 'express';

process.env.ADMIN_USERNAME = 'admin';
process.env.ADMIN_PASSWORD = 'adminpass';

const login = (await import('../api/login.js')).default;
const logout = (await import('../api/logout.js')).default;
const adminLogin = (await import('../api/admin/login.js')).default;
const adminUsers = (await import('../api/admin/users/index.js')).default;
const adminUser = (await import('../api/admin/users/[id].js')).default;
const adminUserPassword = (await import('../api/admin/users/[id]/password.js')).default;
const adminConnected = (await import('../api/admin/connected.js')).default;

const app = express();
app.use(express.json());
app.post('/api/login', login);
app.post('/api/logout', logout);
app.post('/api/admin/login', adminLogin);
app.get('/api/admin/users', adminUsers);
app.post('/api/admin/users', adminUsers);
app.get('/api/admin/connected', adminConnected);
app.get('/api/admin/users/:id', adminUser);
app.delete('/api/admin/users/:id', adminUser);
app.put('/api/admin/users/:id/password', adminUserPassword);

describe('API routes', () => {
  let token;

  it('rejects invalid admin login', async () => {
    const res = await request(app)
      .post('/api/admin/login')
      .send({ username: 'bad', password: 'creds' });
    expect(res.status).toBe(401);
  });

  it('logs in admin', async () => {
    const res = await request(app)
      .post('/api/admin/login')
      .send({ username: 'admin', password: 'adminpass' });
    expect(res.status).toBe(200);
    token = res.body.token;
    expect(token).toBeDefined();
  });

  it('returns users when authorized', async () => {
    const res = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.users)).toBe(true);
  });

  it('creates a user', async () => {
    const res = await request(app)
      .post('/api/admin/users')
      .set('Authorization', `Bearer ${token}`)
      .send({ username: 'charlie', password: 'charlie789', balance: 300 });
    expect(res.status).toBe(201);
    expect(res.body.username).toBe('charlie');
  });

  it('updates and retrieves a user password', async () => {
    await request(app)
      .put('/api/admin/users/1/password')
      .set('Authorization', `Bearer ${token}`)
      .send({ password: 'newpass' })
      .expect(200);

    const res = await request(app)
      .get('/api/admin/users/1')
      .set('Authorization', `Bearer ${token}`);
    expect(res.body.password).toBe('newpass');
  });

  it('deletes a user', async () => {
    await request(app)
      .delete('/api/admin/users/2')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    await request(app)
      .get('/api/admin/users/2')
      .set('Authorization', `Bearer ${token}`)
      .expect(404);
  });

  it('tracks connected users', async () => {
    const loginUser = await request(app)
      .post('/api/login')
      .send({ username: 'alice', password: 'newpass' })
      .expect(200);

    const res = await request(app)
      .get('/api/admin/connected')
      .set('Authorization', `Bearer ${token}`);
    expect(res.body.connected).toBe(1);
    expect(res.body.users[0].username).toBe('alice');

    await request(app)
      .post('/api/logout')
      .send({ id: loginUser.body.id })
      .expect(200);

    const res2 = await request(app)
      .get('/api/admin/connected')
      .set('Authorization', `Bearer ${token}`);
    expect(res2.body.connected).toBe(0);
  });
});
