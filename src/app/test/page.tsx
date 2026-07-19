import { supabase } from '@/lib/supabase'

export default async function TestPage() {
  const { data, error } = await supabase.auth.getSession()

  return (
    <main>
      <h1>Test Supabase</h1>
      <pre>{JSON.stringify({ data, error }, null, 2)}</pre>
    </main>
  )
}
