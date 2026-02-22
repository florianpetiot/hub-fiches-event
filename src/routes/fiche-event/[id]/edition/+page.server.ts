import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ parent }) => {
  // Les données viennent déjà du layout parent
  await parent()
  return {}
}