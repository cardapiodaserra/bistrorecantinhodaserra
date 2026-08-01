// authService — implementação Supabase
// Mantém a mesma API pública do authService Firebase (js/auth.js),
// permitindo rollback apenas trocando os <script> nos HTMLs.

const authService = {

  state: {
    user: null,
    userProfile: null,
    loading: true,
    error: null
  },

  init() {
    supabase.auth.onAuthStateChange(async (event, session) => {
      this.state.loading = true;
      this.state.user = this.normalizeUser(session?.user || null);
      this.state.userProfile = null;

      if (session?.user) {
        try {
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .maybeSingle();

          if (error) {
            console.error('Erro ao carregar perfil:', error);
            this.state.loading = false;
            return;
          }

          if (!profile) {
            await supabase.auth.signOut();
            this.state.error = 'Esta conta não possui perfil. Contate o administrador.';
            this.state.loading = false;
            return;
          }

          if (profile.active === false) {
            await supabase.auth.signOut();
            this.state.error = 'Esta conta foi desativada.';
            this.state.loading = false;
            return;
          }

          this.state.userProfile = this.normalizeProfile(profile);
        } catch (err) {
          console.error('Erro ao carregar perfil:', err);
        }
      }
      this.state.loading = false;
    });
  },

  normalizeUser(user) {
    if (!user) return null;
    return { ...user, uid: user.id };
  },

  normalizeProfile(profile) {
    if (!profile) return null;
    return {
      uid: profile.id,
      id: profile.id,
      email: profile.email,
      displayName: profile.display_name,
      role: profile.role,
      active: profile.active,
      createdAt: profile.created_at
    };
  },

  async login(email, password) {
    this.state.error = null;
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      const { data: { session } } = await supabase.auth.getSession();
      return this.normalizeUser(session?.user || null);
    } catch (err) {
      this.state.error = this.translateError(err.code || err.status);
      throw err;
    }
  },

  async logout() {
    await supabase.auth.signOut();
    window.location.href = 'login.html';
  },

  parseInvokeData(data) {
    if (typeof data === 'string') {
      try { return JSON.parse(data); } catch { return {}; }
    }
    return data || {};
  },

  async createUser(email, password, displayName, role) {
    const { data, error } = await supabase.functions.invoke('create-user', {
      body: { email, password, displayName, role }
    });

    const result = this.parseInvokeData(data);

    if (error) {
      const message = result?.error || error.message;
      throw new Error(message);
    }
    if (result?.error) {
      throw new Error(result.error);
    }

    return result.uid;
  },

  async deactivateUser(uid) {
    const { error } = await supabase
      .from('profiles')
      .update({ active: false })
      .eq('id', uid);
    if (error) throw error;
  },

  async reactivateUser(uid) {
    const { error } = await supabase
      .from('profiles')
      .update({ active: true })
      .eq('id', uid);
    if (error) throw error;
  },

  async deleteUser(uid) {
    const { data, error } = await supabase.functions.invoke('delete-user', {
      body: { uid }
    });

    if (error) {
      const message = data?.error || error.message;
      throw new Error(message);
    }
    if (data?.error) {
      throw new Error(data.error);
    }
  },

  async listUsers() {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map(p => this.normalizeProfile(p));
  },

  get isAdmin() {
    return this.state.userProfile?.role === 'admin';
  },

  get isOperator() {
    return this.state.userProfile?.role === 'operator';
  },

  translateError(code) {
    const errors = {
      'invalid_credentials': 'Email ou senha inválidos.',
      'invalid_grant': 'Email ou senha inválidos.',
      'user_not_found': 'Usuário não encontrado.',
      'email_not_confirmed': 'Email ainda não confirmado.',
      'user_banned': 'Esta conta foi desativada.',
      'weak_password': 'A senha deve ter pelo menos 6 caracteres.',
      'email_exists': 'Este email já está em uso.',
      'user_already_exists': 'Este email já está em uso.',
      'over_email_send_rate_limit': 'Muitas tentativas. Tente novamente mais tarde.',
      400: 'Requisição inválida.',
      401: 'Não autorizado.',
      403: 'Acesso negado.',
      429: 'Muitas tentativas. Tente novamente mais tarde.'
    };
    return errors[code] || `Erro: ${code || 'desconhecido'}`;
  }
};
