// storageService — implementação Supabase
// Mantém a mesma API pública do storageService Firebase (js/storage-service.js).

const BUCKET_NAME = 'menu-items';

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
    const path = `${sectionId}/${timestamp}.${ext}`;

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(path, file, { upsert: false, contentType: file.type });

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(path);

    return { downloadURL: publicUrl, path };
  },

  isFirebaseStorageUrl(url) {
    if (!url) return false;
    return url.includes('firebasestorage.googleapis.com') ||
           url.includes('firebasestorage.app') ||
           url.includes('/storage/v1/object/public/');
  },

  async deleteImage(imageUrl) {
    if (!this.isFirebaseStorageUrl(imageUrl)) return;
    try {
      const path = this.extractPathFromUrl(imageUrl);
      if (!path) return;
      const { error } = await supabase.storage
        .from(BUCKET_NAME)
        .remove([path]);
      if (error && !String(error.message).includes('not found')) {
        console.error('Erro ao deletar imagem do Storage:', error);
      }
    } catch (err) {
      console.error('Erro ao deletar imagem do Storage:', err);
    }
  },

  extractPathFromUrl(imageUrl) {
    if (!imageUrl) return null;
    if (imageUrl.includes('firebasestorage.googleapis.com') || imageUrl.includes('firebasestorage.app')) {
      return null;
    }
    // Formato: <url>/storage/v1/object/public/menu-items/<path>
    const marker = `/storage/v1/object/public/${BUCKET_NAME}/`;
    const idx = imageUrl.indexOf(marker);
    if (idx === -1) return null;
    return decodeURIComponent(imageUrl.slice(idx + marker.length));
  }
};
