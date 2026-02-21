import type { LayoutLoad } from './$types'

export const load: LayoutLoad = async ({ data, parent }) => {
  return { session: data.session }
}