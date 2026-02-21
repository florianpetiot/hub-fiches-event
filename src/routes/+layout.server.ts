import { redirect } from '@sveltejs/kit'
import type { LayoutServerLoad } from './$types'

export const load: LayoutServerLoad = async ({ locals: { safeGetSession, supabase }, url }) => {
  const { session } = await safeGetSession()

  // Si pas connecté et pas sur /login → redirige vers /login
  if (!session && url.pathname !== '/login' && !url.pathname.startsWith('/auth')) {
    redirect(303, '/login')
  }

  // Si connecté et sur /login → redirige vers /
  if (session && url.pathname === '/login') {
    redirect(303, '/dashboard')
  }

  let profile = null
  if (session) {
    const { data } = await supabase
      .from('profiles')
      .select('*, clubs(*)')
      .eq('id', session.user.id)
      .single()
    profile = data
  }

  return { session, profile }
}