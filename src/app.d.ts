// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
		interface Locals {
			supabase: SupabaseClient<import('$lib/types/database.types').Database>
			getUser: () => Promise<import('@supabase/supabase-js').User | null>
		}
	}
}

export {};
