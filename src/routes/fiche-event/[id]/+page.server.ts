import { redirect } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ parent }) => {
  const { fiche, profile } = await parent()

  const isAdmin = profile?.role === 'admin' || profile?.role === 'secretaire_generale'

  if (isAdmin) {
    throw redirect(303, `/fiche-event/${fiche.id}/resume`)
  }

  if (fiche.status === 'brouillon' || fiche.status === 'en_revision') {
    throw redirect(303, `/fiche-event/${fiche.id}/edition`)
  }

  throw redirect(303, `/fiche-event/${fiche.id}/resume`)
}