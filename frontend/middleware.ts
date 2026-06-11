import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

export async function middleware(req: NextRequest) {
  const token = req.cookies.get('trainbot_token')?.value

  // Public routes — always allow
  const { pathname } = req.nextUrl
  if (pathname.startsWith('/login')) {
    return NextResponse.next()
  }

  // No token — bounce to login
  if (!token) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET!)
    const { payload } = await jwtVerify(token, secret)

    // Trainees cannot access trainer routes
    if (pathname.startsWith('/trainer') && payload.role !== 'trainer') {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }

    return NextResponse.next()
  } catch {
    // Token invalid / expired
    return NextResponse.redirect(new URL('/login', req.url))
  }
}

export const config = {
  matcher: ['/dashboard/:path*', '/chat/:path*', '/results/:path*', '/trainer/:path*', '/settings/:path*'],
}
