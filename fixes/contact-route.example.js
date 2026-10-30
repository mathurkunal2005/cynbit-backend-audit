// EXAMPLE ONLY (README section 5.7). A typical Next.js route handler for a contact or
// application form: validate input, rate-limit, return structured errors, log with a request id.
// Not taken from Cynbit's code. Needs:  npm i zod
import { NextResponse } from 'next/server';
import { z } from 'zod';

const schema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(120),
  message: z.string().trim().min(10).max(2000),
});

// Demo-only limiter: serverless instances don't share memory, so in production
// use a shared store (for example Redis) instead of this Map.
const hits = new Map();
function tooMany(ip, limit = 5, windowMs = 60_000) {
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < windowMs);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > limit;
}

export async function POST(req) {
  const requestId = crypto.randomUUID();
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';

  if (tooMany(ip)) {
    return NextResponse.json(
      { error: 'rate_limited', requestId },
      { status: 429, headers: { 'Retry-After': '60' } }
    );
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json', requestId }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'validation_failed', fields: parsed.error.flatten().fieldErrors, requestId },
      { status: 422 }
    );
  }

  // ...store the message here (parameterised query / ORM, never string-built SQL)...

  console.log(JSON.stringify({ level: 'info', route: '/api/contact', requestId }));
  return NextResponse.json({ ok: true, requestId }, { status: 201 });
}
