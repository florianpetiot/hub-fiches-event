import { createBrowserClient, isBrowser } from '@supabase/ssr'
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public'
import type { LayoutLoad } from './$types'

export const load: LayoutLoad = async ({ data, depends, fetch }) => {
  depends('supabase:auth')

  const supabase = isBrowser()
    ? createBrowserClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
        global: { fetch },
      })
    : undefined

  let profile = null
  if (data.session?.user && supabase) {
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*, roles(name, label)')
      .eq('id', data.session.user.id)
      .single()
    profile = profileData
  }

  return { session: data.session, profile, supabase }
}