import { NextResponse } from 'next/server';
import client from '../../../lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const wallet = searchParams.get('wallet');

  if (!wallet) {
    return NextResponse.json({ error: 'Wallet address required' }, { status: 400 });
  }

  try {
    const result = await client.execute({
      sql: `
        SELECT * FROM history_logs 
        WHERE wallet_pubkey = ? 
        ORDER BY timestamp DESC 
        LIMIT 100
      `,
      args: [wallet]
    });
    return NextResponse.json({ logs: result.rows });
  } catch (error) {
    console.error('Failed to fetch history:', error);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}
