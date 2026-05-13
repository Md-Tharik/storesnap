import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { initializeApp, cert, getApps } from 'npm:firebase-admin/app'
import { getMessaging } from 'npm:firebase-admin/messaging'

serve(async (req: Request) => {
  try {
    const payload = await req.json()
    const { user_id, title, body } = payload

    // 1. Initialize Supabase Admin Client (Bypass RLS)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 2. Fetch the FCM Token
    console.log("Looking up token for user_id:", user_id)
    const { data, error } = await supabaseAdmin
      .from('sellers')
      .select('fcm_token')
      .eq('id', user_id)
      .single()

    console.log("Database lookup result:", data, error)

    if (error || !data?.fcm_token) {
      console.log("Token lookup failed or missing for user:", user_id, error)
      return new Response(JSON.stringify({ ok: true, sent: 0, reason: "No token found" }), { headers: { "Content-Type": "application/json" } })
    }

    // 3. Initialize Firebase Admin (Only once)
    if (getApps().length === 0) {
      const rawSA = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_JSON') ?? ''
      console.log("Service account env var length:", rawSA.length)
      console.log("Service account starts with:", rawSA.substring(0, 80))

      if (!rawSA) throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON secret is not set")

      let serviceAccount
      try {
        serviceAccount = JSON.parse(rawSA)
      } catch (e) {
        throw new Error(`Failed to parse service account JSON: ${(e as Error).message}`)
      }

      console.log("Parsed project_id:", serviceAccount.project_id)
      console.log("Parsed client_email:", serviceAccount.client_email)

      if (!serviceAccount.project_id) throw new Error("Service account JSON is missing project_id field")

      initializeApp({ credential: cert(serviceAccount) })
    }

    // 4. Send notification
    const message = {
      notification: { title, body },
      token: data.fcm_token
    }

    const response = await getMessaging().send(message)
    console.log("Successfully sent message:", response)

    return new Response(JSON.stringify({ ok: true, sent: 1, messageId: response }), { headers: { "Content-Type": "application/json" } })

  } catch (error) {
    console.error("Fatal function error:", (error as Error).message)
    return new Response(JSON.stringify({ error: (error as Error).message }), { status: 400, headers: { "Content-Type": "application/json" } })
  }
})
