import { type NextRequest, NextResponse } from 'next/server'

import type { User } from "@/hooks/use-user"
import { isVolunteer, isHacker, isAdmin } from "@/lib/is-role";
import {siteConfig} from "@/config/site";

async function getUserProfile(request: NextRequest): Promise<User | null> {
  let userProfile: { data: User } | undefined
  const sessionCookie = request.cookies.get("durhack-megateams-session")
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

    // otherwise, the user is not permitted.
    return NextResponse.redirect(new URL("/forbidden", request.nextUrl))
  }

  if (request.nextUrl.pathname.startsWith("/hacker")) {
    const userProfile = await getUserProfile(request);
    // if the user is not logged in, go back to root
    if (!userProfile) return redirectToRoot(request)
    // if the user is not a hacker, go back to root
    if (!isHacker(userProfile)) return redirectToRoot(request)
    // continue as usual
    return
  }

  if (request.nextUrl.pathname.startsWith("/volunteer/admin")) {
    const userProfile = await getUserProfile(request);
    // if the user is not logged in, go back to root
    if (!userProfile) return redirectToRoot(request)
    // if the user is not an admin, go back to /volunteer
    if (!isAdmin(userProfile)) return NextResponse.redirect(new URL("/volunteer", request.nextUrl))
    // continue as usual
    return
  }

  if (request.nextUrl.pathname.startsWith("/volunteer")) {
    const userProfile = await getUserProfile(request);
    // if the user is not logged in, go back to root
    if (!userProfile) return redirectToRoot(request)
    // if the user is not a volunteer, go back to root
    if (!isVolunteer(userProfile)) return redirectToRoot(request)
    // continue as usual
    return
  }
}
