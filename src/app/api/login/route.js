import pool from '@/lib/db';

export async function POST(req) {
  try {
    const { email } = await req.json();

    const [rows] = await pool.query(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    if (!rows || rows.length === 0) {
      return new Response(
        JSON.stringify({ statusCode: 404, ok: false, message: 'Never registered' }),
        { status: 404 }
      );
    }

    const user = rows[0];
    console.log(user);
    return new Response(
      JSON.stringify({
        statusCode: 200,
        ok: true,
        message: 'Login successful',
        role_id: user.role_id
      }),
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