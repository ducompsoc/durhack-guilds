import { type NextRequest, NextResponse } from 'next/server'

import type { User } from "@/lib/useUser"
import { isVolunteer, isHacker, isAdmin } from "@/lib/is-role";

async function getUserProfile(request: NextRequest): Promise<User | null> {
  let userProfile: { data: User } | undefined
  const sessionCookie = request.cookies.get("durhack-megateams-session")
  if (sessionCookie != null) {
    const userProfileResponse = await fetch(
      new URL('http://localhost:8081/api/user'),
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

// This function can be marked `async` if using `await` inside
export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname === "/") {
    const userProfile = await getUserProfile(request);
    if (!userProfile) return

    // if the user is an admin or volunteer, go to /volunteer
    if (isVolunteer(userProfile)) {
      return NextResponse.redirect(new URL("/volunteer", request.nextUrl))
    }

    // otherwise, assume the user is a hacker (Keycloak should have a policy
    // configured to only allow certain groups to log in to megateams)
    return NextResponse.redirect(new URL("/hacker", request.nextUrl))
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