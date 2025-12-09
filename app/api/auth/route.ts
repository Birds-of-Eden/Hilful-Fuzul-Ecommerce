import { NextRequest } from 'next/server';

// This file is reserved for NextAuth.js dynamic route handling
// NextAuth.js will handle all auth-related routes through its configuration

export async function GET(request: NextRequest) {
  return new Response('Auth route', { status: 200 });
}

export async function POST(request: NextRequest) {
  return new Response('Auth route', { status: 200 });
}
