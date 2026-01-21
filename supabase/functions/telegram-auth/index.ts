import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { createHmac, createHash } from 'https://deno.land/std@0.168.0/node/crypto.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
interface TelegramAuthData {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

interface RequestBody {
  mode: 'link' | 'login' | 'unlink';
  telegramData?: TelegramAuthData;
}

/**
 * Проверяет подлинность данных от Telegram
 */
function verifyTelegramData(data: TelegramAuthData, botToken: string): boolean {
  const { hash, ...checkData } = data;

  // Создаём строку для проверки
  const checkString = Object.keys(checkData)
    .sort()
    .map((key) => `${key}=${checkData[key as keyof typeof checkData]}`)
    .join('\n');

  // Создаём секретный ключ из токена бота
  const secretKey = createHash('sha256').update(botToken).digest();

  // Вычисляем HMAC
  const hmac = createHmac('sha256', secretKey).update(checkString).digest('hex');

  return hmac === hash;
}

/**
 * Проверяет что auth_date не старше 5 минут
 */
function isAuthDateValid(authDate: number): boolean {
  const now = Math.floor(Date.now() / 1000);
  const maxAge = 5 * 60; // 5 минут
  return now - authDate < maxAge;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!botToken || !supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing environment variables');
    }

    // Создаём клиент с service role для admin операций
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const body: RequestBody = await req.json();
    const { mode, telegramData } = body;

    console.log('Request mode:', mode);
    console.log('Telegram data:', telegramData ? { id: telegramData.id, auth_date: telegramData.auth_date } : 'none');

    // Для unlink не нужны данные Telegram
    if (mode !== 'unlink') {
      if (!telegramData) {
        throw new Error('Telegram data is required');
      }

      // Проверяем подлинность данных
      const isHashValid = verifyTelegramData(telegramData, botToken);
      console.log('Hash verification:', isHashValid);

      if (!isHashValid) {
        return new Response(
          JSON.stringify({ error: 'Неверная подпись Telegram' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Проверяем актуальность данных
      const isDateValid = isAuthDateValid(telegramData.auth_date);
      const now = Math.floor(Date.now() / 1000);
      console.log('Date check:', { auth_date: telegramData.auth_date, now, diff: now - telegramData.auth_date, isValid: isDateValid });

      if (!isDateValid) {
        return new Response(
          JSON.stringify({ error: 'Данные устарели. Попробуйте снова.' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Получаем текущего пользователя из заголовка Authorization (если есть)
    const authHeader = req.headers.get('Authorization');
    let currentUserId: string | null = null;

    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
      if (!userError && userData.user) {
        currentUserId = userData.user.id;
      }
    }

    // === РЕЖИМ: ПРИВЯЗКА ===
    if (mode === 'link') {
      if (!currentUserId) {
        return new Response(
          JSON.stringify({ error: 'Необходима авторизация' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Проверяем не привязан ли уже этот Telegram к другому аккаунту
      const { data: existingProfile } = await supabaseAdmin
        .from('user_profiles')
        .select('user_id')
        .eq('telegram_id', telegramData!.id)
        .single();

      if (existingProfile && existingProfile.user_id !== currentUserId) {
        return new Response(
          JSON.stringify({ error: 'Этот Telegram уже привязан к другому аккаунту' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Привязываем Telegram к профилю
      const { error: updateError } = await supabaseAdmin
        .from('user_profiles')
        .update({
          telegram_id: telegramData!.id,
          telegram: telegramData!.username ? `@${telegramData!.username}` : null,
        })
        .eq('user_id', currentUserId);

      if (updateError) {
        throw updateError;
      }

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // === РЕЖИМ: ОТВЯЗКА ===
    if (mode === 'unlink') {
      if (!currentUserId) {
        return new Response(
          JSON.stringify({ error: 'Необходима авторизация' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { error: updateError } = await supabaseAdmin
        .from('user_profiles')
        .update({ telegram_id: null })
        .eq('user_id', currentUserId);

      if (updateError) {
        throw updateError;
      }

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // === РЕЖИМ: ВХОД ===
    if (mode === 'login') {
      console.log('Login mode - searching for telegram_id:', telegramData!.id);

      // Ищем пользователя по telegram_id
      const { data: profile, error: profileError } = await supabaseAdmin
        .from('user_profiles')
        .select('user_id, email')
        .eq('telegram_id', telegramData!.id)
        .single();

      console.log('Profile search result:', { profile, error: profileError?.message });

      if (profile) {
        // Пользователь найден - генерируем magic link и используем OTP для создания сессии
        const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
          type: 'magiclink',
          email: profile.email,
        });

        if (linkError || !linkData) {
          throw linkError || new Error('Failed to generate link');
        }

        // Используем OTP из сгенерированной ссылки для верификации
        const { data: sessionData, error: sessionError } = await supabaseAdmin.auth.verifyOtp({
          email: profile.email,
          token: linkData.properties.email_otp,
          type: 'email',
        });

        if (sessionError || !sessionData.session) {
          console.error('verifyOtp error:', sessionError);
          throw sessionError || new Error('Failed to create session');
        }

        return new Response(
          JSON.stringify({
            success: true,
            session: {
              access_token: sessionData.session.access_token,
              refresh_token: sessionData.session.refresh_token,
            },
            user: {
              id: profile.user_id,
              email: profile.email,
            },
            isNewUser: false,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Пользователь не найден - создаём нового
      // Генерируем уникальный email на основе Telegram ID
      const generatedEmail = `tg_${telegramData!.id}@telegram.local`;
      const generatedPassword = crypto.randomUUID();

      // Создаём пользователя
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: generatedEmail,
        password: generatedPassword,
        email_confirm: true,
        user_metadata: {
          telegram_id: telegramData!.id,
          first_name: telegramData!.first_name,
          last_name: telegramData!.last_name,
          username: telegramData!.username,
        },
      });

      if (createError || !newUser.user) {
        throw createError || new Error('Failed to create user');
      }

      // Создаём профиль
      const { error: newProfileError } = await supabaseAdmin.from('user_profiles').insert({
        user_id: newUser.user.id,
        email: generatedEmail,
        telegram_id: telegramData!.id,
        telegram: telegramData!.username ? `@${telegramData!.username}` : null,
        first_name: telegramData!.first_name,
        last_name: telegramData!.last_name || null,
      });

      if (newProfileError) {
        console.error('Profile creation error:', newProfileError);
      }

      // Создаём сессию для нового пользователя через verifyOtp
      const { data: newLinkData, error: newLinkError } = await supabaseAdmin.auth.admin.generateLink({
        type: 'magiclink',
        email: generatedEmail,
      });

      if (newLinkError || !newLinkData) {
        throw newLinkError || new Error('Failed to generate link for new user');
      }

      const { data: newSessionData, error: newSessionError } = await supabaseAdmin.auth.verifyOtp({
        email: generatedEmail,
        token: newLinkData.properties.email_otp,
        type: 'email',
      });

      if (newSessionError || !newSessionData.session) {
        throw newSessionError || new Error('Failed to create session for new user');
      }

      return new Response(
        JSON.stringify({
          success: true,
          session: {
            access_token: newSessionData.session.access_token,
            refresh_token: newSessionData.session.refresh_token,
          },
          user: {
            id: newUser.user.id,
            email: generatedEmail,
          },
          isNewUser: true,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid mode' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
