import { redirect } from '@sveltejs/kit'
import type { LayoutServerLoad } from './$types'

export const load: LayoutServerLoad = async ({ locals: { supabase, getUser }, url }) => {
  const user = await getUser()
  const isPublicPath =
    url.pathname === '/login' ||
    url.pathname === '/offline' ||
    url.pathname.startsWith('/auth')

  // Si la racine du site, redirige selon l'authentification
  if (url.pathname === '/') {
    throw redirect(303, user ? '/dashboard' : '/login')
  }

  // Si pas connecté et pas sur /login → redirige vers /login
  if (!user && !isPublicPath) {
    throw redirect(303, '/login')
  }

  // Si connecté et sur /login → redirige vers /dashboard
  if (user && url.pathname === '/login') {
    throw redirect(303, '/dashboard')
  }

  const session = user ? { user } : null

  let profile = null
  if (user) {
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*, roles!inner(name, label)')
      .eq('id', user.id)
      .single()
    profile = profileData
  }

  return { session, profile }
}