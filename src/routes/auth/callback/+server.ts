import { redirect } from '@sveltejs/kit'
import type { RequestHandler, RequestEvent } from '@sveltejs/kit'

export const GET: RequestHandler = async ({ url, locals: { supabase } }: RequestEvent) => {
  const code = url.searchParams.get('code')
  const next = url.searchParams.get('next') ?? '/dashboard'

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) redirect(303, '/login')
  }

  throw redirect(303, next)
}