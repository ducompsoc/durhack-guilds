import { type NextRequest, NextResponse } from 'next/server'

import type { User } from "@/hooks/use-user"
import { isVolunteer, isHacker, isAdmin } from "@/lib/is-role";
import { siteConfig } from "@/config/site";

async function getUserProfile(request: NextRequest): Promise<User | null> {
  let userProfile: { data: User } | undefined
  const sessionCookie = request.cookies.get(siteConfig.sessionCookieName)
  if (sessionCookie != null) {
    const userProfileResponse = await fetch(
      new URL('/api/user', siteConfig.url),
      {
        headers: { cookie: request.headers.get("cookie")! }
      }
    )
    if (userProfileResponse.ok) userProfile = await userProfileResponse.json()
  }
  return userProfile?.data ?? null
}

function redirectToRoot(request: NextRequest) {
  return NextResponse.redirect(new URL("/", request.nextUrl))
}

function redirectUnauthenticated(request: NextRequest) {
  const loginUrl = new URL("/api/auth/keycloak/login", siteConfig.url)
  loginUrl.searchParams.set("destination", request.nextUrl.href)
  return NextResponse.redirect(loginUrl)
}

function redirectForbidden(request: NextRequest) {
  request.nextUrl.searchParams.set("status_code", "403")
  request.nextUrl.searchParams.set("from", request.nextUrl.pathname)
  request.nextUrl.pathname = "/error"
  return NextResponse.redirect(request.nextUrl)
}

export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname === "/") {
    const userProfile = await getUserProfile(request);
    if (!userProfile) return

    // if the user is an admin or volunteer, go to /volunteer
    if (isVolunteer(userProfile)) {
      return NextResponse.redirect(new URL("/volunteer", request.nextUrl))
    }

    // if the user is a hacker, go to /hacker
    if (isHacker(userProfile)) {
      return NextResponse.redirect(new URL("/hacker", request.nextUrl))
    }

    return redirectForbidden(request)
  }

  if (request.nextUrl.pathname.startsWith("/hacker") && !request.nextUrl.pathname.startsWith("/hacker/redeem")) {
    const userProfile = await getUserProfile(request);
    // if the user is not logged in, prompt them to login
    if (!userProfile) return redirectUnauthenticated(request)
    // if the user is not a hacker, they are forbidden from viewing this page
    if (!isHacker(userProfile)) return redirectForbidden(request)
    // continue as usual
    return
  }

  if (request.nextUrl.pathname.startsWith("/volunteer/admin")) {
    const userProfile = await getUserProfile(request);
    // if the user is not logged in, prompt them to login
    if (!userProfile) return redirectUnauthenticated(request)
    // if the user is not an admin, they are forbidden from viewing this page
    if (!isAdmin(userProfile)) return redirectForbidden(request)
    // continue as usual
    return
  }

  if (request.nextUrl.pathname.startsWith("/volunteer")) {
    const userProfile = await getUserProfile(request);
    // if the user is not logged in, prompt them to login
    if (!userProfile) return redirectUnauthenticated(request)
    // if the user is not a volunteer, they are forbidden from viewing this page
    if (!isVolunteer(userProfile)) return redirectForbidden(request)
    // continue as usual
    return
  }
}
