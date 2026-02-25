import { redirect } from '@sveltejs/kit'
import type { LayoutServerLoad } from './$types'

export const load: LayoutServerLoad = async ({ locals: { supabase }, url }) => {
  const { data: authData } = await supabase.auth.getUser()
  const user = authData?.user

  // Si la racine du site, redirige selon l'authentification
  if (url.pathname === '/') {
    throw redirect(303, user ? '/dashboard' : '/login')
  }

  // Si pas connecté et pas sur /login → redirige vers /login
  if (!user && url.pathname !== '/login' && !url.pathname.startsWith('/auth')) {
    throw redirect(303, '/login')
  }

  // Si connecté et sur /login → redirige vers /dashboard
  if (user && url.pathname === '/login') {
    throw redirect(303, '/dashboard')
  }

  let profile = null
  if (user) {
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    profile = profileData
  }

  const session = user ? { user } : null
  return { session, profile }
}