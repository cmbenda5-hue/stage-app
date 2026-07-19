import { redirect } from 'next/navigation'
import { supabase } from '../lib/supabase'
import LogoutButton from '../components/LogoutButton'

export default async function Home() {
  const { data } = await supabase.auth.getSession()

  if (!data.session) {
    redirect('/login')
  }

  return (
    <main>
      <h1>Stage App</h1>
      <LogoutButton />
    </main>
  )
}
