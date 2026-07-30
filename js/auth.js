const authService = {

  state: {
    user: null,
    userProfile: null,
    loading: true,
    error: null
  },

  init() {
    auth.onAuthStateChanged(async (user) => {
      this.state.loading = true;
      this.state.user = user;
      this.state.userProfile = null;

      if (user) {
        try {
          const doc = await db.collection('users').doc(user.uid).get();
          if (doc.exists) {
            const data = doc.data();
            if (data.active === false) {
              await auth.signOut();
              this.state.error = 'Esta conta foi desativada.';
              return;
            }
            this.state.userProfile = data;
          }
        } catch (err) {
          console.error('Erro ao carregar perfil:', err);
        }
      }
      this.state.loading = false;
    });
  },

  async login(email, password) {
    this.state.error = null;
    try {
      const result = await auth.signInWithEmailAndPassword(email, password);
      return result.user;
    } catch (err) {
      this.state.error = this.translateError(err.code);
      throw err;
    }
  },

  async logout() {
    await auth.signOut();
    window.location.href = 'login.html';
  },

  async createUser(email, password, displayName, role) {
    const apiKey = firebase.app().options.apiKey;

    const response = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, returnSecureToken: true })
      }
    );

    if (!response.ok) {
      const err = await response.json();
      const msg = err.error?.message || 'Erro ao criar usuário';
      if (msg.includes('EMAIL_EXISTS')) {
        throw new Error('Este email já está em uso.');
      }
      if (msg.includes('WEAK_PASSWORD')) {
        throw new Error('Senha muito fraca. Mínimo 6 caracteres.');
      }
      throw new Error(msg);
    }

    const userData = await response.json();
    const uid = userData.localId;

    await db.collection('users').doc(uid).set({
      email,
      role,
      displayName,
      active: true,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    return uid;
  },

  async deactivateUser(uid) {
    await db.collection('users').doc(uid).update({ active: false });
  },

  async reactivateUser(uid) {
    await db.collection('users').doc(uid).update({ active: true });
  },

  async listUsers() {
    const snapshot = await db.collection('users')
      .orderBy('createdAt', 'desc')
      .get();

    return snapshot.docs.map(doc => ({
      uid: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || null
    }));
  },

  get isAdmin() {
    return this.state.userProfile?.role === 'admin';
  },

  get isOperator() {
    return this.state.userProfile?.role === 'operator';
  },

  translateError(code) {
    const errors = {
      'auth/invalid-credential': 'Email ou senha inválidos.',
      'auth/user-not-found': 'Usuário não encontrado.',
      'auth/wrong-password': 'Senha incorreta.',
      'auth/invalid-email': 'Formato de email inválido.',
      'auth/user-disabled': 'Esta conta foi desativada.',
      'auth/email-already-in-use': 'Este email já está em uso.',
      'auth/weak-password': 'A senha deve ter pelo menos 6 caracteres.',
      'auth/too-many-requests': 'Muitas tentativas. Tente novamente mais tarde.',
      'auth/network-request-failed': 'Erro de conexão. Verifique sua internet.'
    };
    return errors[code] || `Erro: ${code}`;
  }
};
