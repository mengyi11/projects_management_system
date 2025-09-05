import { db } from '../../../lib/db';

export async function POST(req, res) {
  try {
    const { username, password } = await req.json();

    const [rows] = await db.execute(
      'SELECT * FROM users WHERE name = ? AND password = ?',
      [username, password]
    );

    const user = rows[0];
    if (!user || user.length === 0) {
      return new Response(JSON.stringify({ statusCode: 401, ok: false, message: 'Invalid credentials' }),
      { status: 401 }
      );
    }

    return new Response(
      JSON.stringify({ statusCode: 200, ok: true, message: 'Login successful' }),
      { status: 200 }
    );

  } catch (err) {
    console.error(err);
    return new Response(
      JSON.stringify({ statusCode: 500, ok: false, message: 'Database error' }),
      { status: 500 }
    );
  }
}