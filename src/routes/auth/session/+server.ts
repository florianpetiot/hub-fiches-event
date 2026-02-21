import type { RequestHandler } from './$types'

export const POST: RequestHandler = async ({ request, locals: { supabase } }) => {
  try {
    const { access_token, refresh_token } = await request.json()

    if (!access_token) {
      return new Response('Missing access_token', { status: 400 })
    }

    // Set the session on the server-side Supabase client; createServerClient will persist cookies
    await supabase.auth.setSession({ access_token, refresh_token })

    return new Response(null, { status: 200 })
  } catch (e) {
    return new Response('Invalid body', { status: 400 })
  }
}

export const DELETE: RequestHandler = async ({ locals: { supabase } }) => {
    await supabase.auth.signOut()
    return new Response(null, { status: 200 })
}
