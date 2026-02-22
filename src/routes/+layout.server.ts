import { redirect } from '@sveltejs/kit'
import type { LayoutServerLoad } from './$types'

export const load: LayoutServerLoad = async ({ locals: { supabase }, url }) => {
  const { data: authData } = await supabase.auth.getUser()
  const user = authData?.user

  // Si pas connecté et pas sur /login → redirige vers /login
  if (!user && url.pathname !== '/login' && !url.pathname.startsWith('/auth')) {
    redirect(303, '/login')
  }

  // Si connecté et sur /login → redirige vers /dashboard
  if (user && url.pathname === '/login') {
    redirect(303, '/dashboard')
  }

  let profile = null
  if (user) {
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*, clubs(*)')
      .eq('id', user.id)
      .single()
    profile = profileData
  }

  const session = user ? { user } : null
  return { session, profile }
}