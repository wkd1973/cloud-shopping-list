import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import LoginForm from './LoginForm'
import Link from 'next/link'
import { APP_VERSION } from '@/lib/version'

interface Props { searchParams: Promise<{ redirectTo?: string; error?: string }> }

export default async function LoginPage(props: Props) {
  const searchParams = await props.searchParams;
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect(searchParams.redirectTo ?? '/list')

  return (
    <main className="bg-surface-bg min-h-screen flex items-center justify-center p-gutter relative overflow-hidden">
      <div className="w-full max-w-sm z-10">
        <div className="bg-white shadow-md transition-transform duration-300 hover:-translate-y-0.5 ease-out rounded-[1rem] p-stack-lg flex flex-col items-center">
          {/* Branding Header */}
          <div className="mb-stack-lg text-center">
            <div className="w-20 h-20 bg-primary-container rounded-full flex items-center justify-center mb-stack-md mx-auto shadow-sm">
              <span className="text-4xl">🛒</span>
            </div>
            <h1 className="font-headline-lg text-[24px] leading-[32px] font-semibold text-on-surface mb-2 tracking-tight">Zakupy</h1>
            <p className="font-body-md text-[14px] leading-[20px] text-on-surface-variant px-4">Twoja inteligentna lista zakupów</p>
          </div>
          
          <LoginForm redirectTo={searchParams.redirectTo} error={searchParams.error} />
        </div>
        
        {/* App Quality visual */}
        <div className="mt-stack-lg grid grid-cols-3 gap-2 px-4 opacity-40">
          <div className="h-1 bg-outline-variant rounded-full"></div>
          <div className="h-1 bg-outline-variant rounded-full"></div>
          <div className="h-1 bg-outline-variant rounded-full"></div>
        </div>
        
        <div className="mt-8 text-center text-[12px] text-on-surface-variant opacity-70">
          Korzystając z aplikacji, akceptujesz nasz{' '}
          <Link href="/terms" className="underline hover:text-primary">Regulamin</Link>
          {' '}oraz{' '}
          <Link href="/privacy" className="underline hover:text-primary">Politykę Prywatności</Link>.
          <br/>
          <Link href="/help" className="underline hover:text-primary mt-1 inline-block">Potrzebujesz pomocy?</Link>
          <div className="mt-2 text-[10px] text-on-surface-variant opacity-50 flex flex-col items-center gap-0.5">
            <span className="font-mono">Wersja {APP_VERSION}</span>
            <span>Stworzone przez <a href="https://github.com/wkd1973" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">Wojciecha Dobrowolskiego</a></span>
          </div>
        </div>
      </div>
      
      {/* Visual Background Element (Atmospheric) */}
      <div className="fixed -bottom-20 -right-20 w-80 h-80 bg-primary-container/10 rounded-full blur-3xl -z-10"></div>
      <div className="fixed -top-20 -left-20 w-64 h-64 bg-category-produce/5 rounded-full blur-3xl -z-10"></div>
    </main>
  )
}
