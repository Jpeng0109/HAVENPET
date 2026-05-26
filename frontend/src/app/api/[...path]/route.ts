import { NextRequest, NextResponse } from 'next/server';

function getBackendBase(): string | null {
  const url = process.env.BACKEND_URL?.trim().replace(/\/$/, '');
  return url || null;
}

async function proxyRequest(req: NextRequest, pathSegments: string[]) {
  const base = getBackendBase();
  if (!base) {
    return NextResponse.json(
      {
        message:
          'API is not connected. Deploy the NestJS backend and set BACKEND_URL on Vercel (e.g. https://havenpet-api.onrender.com).',
      },
      { status: 503 },
    );
  }

  const path = pathSegments.join('/');
  const target = `${base}/api/${path}${req.nextUrl.search}`;

  const headers = new Headers();
  const contentType = req.headers.get('content-type');
  if (contentType) headers.set('content-type', contentType);
  const authorization = req.headers.get('authorization');
  if (authorization) headers.set('authorization', authorization);

  const hasBody = req.method !== 'GET' && req.method !== 'HEAD';
  const body = hasBody ? await req.arrayBuffer() : undefined;

  let upstream: Response;
  try {
    upstream = await fetch(target, {
      method: req.method,
      headers,
      body,
    });
  } catch {
    return NextResponse.json(
      { message: `Cannot reach backend at ${base}. Check BACKEND_URL and that the API is running.` },
      { status: 502 },
    );
  }

  const responseHeaders = new Headers();
  const upstreamType = upstream.headers.get('content-type');
  if (upstreamType) responseHeaders.set('content-type', upstreamType);

  return new NextResponse(upstream.body, {
    status: upstream.status,
    headers: responseHeaders,
  });
}

type RouteContext = { params: { path: string[] } };

function handle(req: NextRequest, context: RouteContext) {
  return proxyRequest(req, context.params.path);
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;
