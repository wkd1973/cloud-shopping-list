// /api/cron/notifications/route.ts
//
// Route Handler wywołujący Edge Function send-push.
// Cała logika jest w Supabase — ten plik to ~10 linii "przekaźnika".
//
// Vercel Cron wywołuje ten endpoint co godzinę (harmonogram w vercel.json).
// Weryfikacja: Vercel dodaje nagłówek Authorization: Bearer <CRON_SECRET>

export const runtime = 'edge'

export async function GET(request: Request) {
  // Weryfikuj że to Vercel Cron (nie ktoś kto znalazł endpoint)
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  // Wywołaj Edge Function
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send-push`,
    {
      method:  'POST',
      headers: {
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type':  'application/json',
      },
      body: JSON.stringify({
        title: '🛒 Zakupy',
        body:  'Sprawdź czy lista jest gotowa',
        url:   '/list',
        tag:   'reminder',
      }),
    }
  )

  const data = await res.json()
  return new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json' },
  })
}
