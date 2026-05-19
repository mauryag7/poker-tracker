import { POST } from '@/app/api/auth/register/route';
import { prismaMock } from '../setup/prisma-mock';

// No session needed for register
const makeRequest = (body: object) =>
  new Request('http://localhost/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

describe('POST /api/auth/register', () => {
  it('returns 400 when fields are missing', async () => {
    const res = await POST(makeRequest({ name: 'Alice' })); // missing email + password
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.message).toMatch(/Missing fields/);
  });

  it('returns 400 when email already exists', async () => {
    (prismaMock.player.findUnique as jest.Mock).mockResolvedValue({ id: 'existing', email: 'alice@test.com' });
    const res = await POST(makeRequest({ name: 'Alice', email: 'alice@test.com', password: 'pass123' }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.message).toMatch(/already exists/);
  });

  it('creates player and returns 201 on success', async () => {
    (prismaMock.player.findUnique as jest.Mock).mockResolvedValue(null);
    (prismaMock.player.create as jest.Mock).mockResolvedValue({
      id: 'new-id', name: 'Alice', email: 'alice@test.com'
    });

    const res = await POST(makeRequest({ name: 'Alice', email: 'alice@test.com', password: 'pass123' }));
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.player.email).toBe('alice@test.com');
    // Password should NOT be in the response
    expect(data.player.password).toBeUndefined();
  });
});
