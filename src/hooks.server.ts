import { createServerClient } from '@supabase/ssr'
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public'
import type { Handle } from '@sveltejs/kit'
import type { User } from '@supabase/supabase-js'

export const handle: Handle = async ({ event, resolve }) => {
  event.locals.supabase = createServerClient(
    PUBLIC_SUPABASE_URL,
    PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll: () => event.cookies.getAll(),
        setAll: (cookies) => cookies.forEach(({ name, value, options }) =>
          event.cookies.set(name, value, { ...options, path: '/' })
        ),
      },
    }
  )

  // Mémoisation : un seul appel auth par requête HTTP, même si getUser() est appelé plusieurs fois
  let userPromise: Promise<User | null>
  event.locals.getUser = () => {
    if (!userPromise) {
      userPromise = event.locals.supabase.auth.getUser()
        .then((res: { data: { user: User | null }; error: unknown }) => res.error ? null : res.data.user)
    }
    return userPromise
  }

  return resolve(event, {
    filterSerializedResponseHeaders: (name) => name === 'content-range',
  })
}