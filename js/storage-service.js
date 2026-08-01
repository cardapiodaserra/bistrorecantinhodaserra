const storageService = {
  validateFile(file) {
    if (!file) throw new Error('Nenhum arquivo selecionado.');
    const maxSize = 5 * 1024 * 1024;
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowed.includes(file.type)) {
      throw new Error('Formato não suportado. Use JPG, PNG, WebP ou GIF.');
    }
    if (file.size > maxSize) {
      throw new Error('Imagem muito grande. Máximo 5MB.');
    }
  },

  async uploadItemImage(file, sectionId) {
    this.validateFile(file);
    const timestamp = Date.now();
    const ext = file.name.split('.').pop() || 'jpg';
    const path = `menu-items/${sectionId}/${timestamp}.${ext}`;
    const ref = firebase.storage().ref(path);
    const snapshot = await ref.put(file);
    const downloadURL = await snapshot.ref.getDownloadURL();
    return { downloadURL, path };
  },

  isFirebaseStorageUrl(url) {
    if (!url) return false;
    return url.includes('firebasestorage.googleapis.com') ||
           url.includes('firebasestorage.app');
  },

  async deleteImage(imageUrl) {
    if (!this.isFirebaseStorageUrl(imageUrl)) return;
    try {
      const ref = firebase.storage().refFromURL(imageUrl);
      await ref.delete();
    } catch (err) {
      if (err.code !== 'storage/object-not-found') {
        console.error('Erro ao deletar imagem do Storage:', err);
      }
    }
  }
};
