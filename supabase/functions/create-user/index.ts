import { createClient } from "jsr:@supabase/supabase-js@2";

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  { auth: { persistSession: false } },
);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { email, password, displayName, role } = await req.json();
    if (!email || !password) {
      return new Response(JSON.stringify({ error: "Email e senha são obrigatórios." }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    // ===== Bootstrap do primeiro administrador =====
    // Se NÃO existir nenhum admin ativo, qualquer chamada (mesmo anônima)
    // pode criar o primeiro usuário, que é FORÇADO a ser admin.
    // Após isso, o caminho é bloqueado para sempre.
    const { count: adminCount, error: countError } = await supabaseAdmin
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("role", "admin")
      .eq("active", true);

    if (countError) {
      return new Response(JSON.stringify({ error: countError.message }), {
        status: 500,
        headers: corsHeaders,
      });
    }

    const isBootstrap = adminCount === 0;
    let userRole = isBootstrap ? "admin" : "operator";

    if (!isBootstrap) {
      // ===== Fluxo normal: apenas admin autenticado =====
      const authHeader = req.headers.get("Authorization");
      if (!authHeader) {
        return new Response(JSON.stringify({ error: "Não autorizado." }), {
          status: 401,
          headers: corsHeaders,
        });
      }
      const token = authHeader.replace("Bearer ", "");
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_ANON_KEY")!,
        { global: { headers: { Authorization: authHeader } }, auth: { persistSession: false } },
      );
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      if (authError || !user) {
        return new Response(JSON.stringify({ error: "Não autorizado." }), {
          status: 401,
          headers: corsHeaders,
        });
      }

      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("role, active")
        .eq("id", user.id)
        .single();

      if (!profile || profile.role !== "admin" || profile.active !== true) {
        return new Response(JSON.stringify({ error: "Apenas administradores podem criar usuários." }), {
          status: 403,
          headers: corsHeaders,
        });
      }

      const allowedRoles = ["admin", "operator"];
      if (allowedRoles.includes(role)) {
        userRole = role;
      }
    }

    const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { display_name: displayName || null },
    });

    if (createError) {
      let message = createError.message;
      if (message.includes("already been registered")) {
        message = "Este email já está em uso.";
      } else if (message.includes("Password should be at least")) {
        message = "A senha deve ter pelo menos 6 caracteres.";
      }
      return new Response(JSON.stringify({ error: message }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    // Atualiza role no perfil criado pelo trigger handle_new_user
    await supabaseAdmin
      .from("profiles")
      .update({ role: userRole, display_name: displayName || null })
      .eq("id", created.user.id);

    return new Response(JSON.stringify({ uid: created.user.id, adminCreated: isBootstrap }), {
      status: 200,
      headers: corsHeaders,
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});
