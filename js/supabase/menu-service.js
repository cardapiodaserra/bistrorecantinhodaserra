// menuService — implementação Supabase
// Mantém a mesma API pública do menuService Firebase (js/menu-service.js).

const menuService = {

  normalizeSection(data) {
    return {
      id: data.id,
      title: data.title || '',
      type: data.type || 'food',
      order: typeof data.order === 'number' ? data.order : 0,
      items: (data.items || []).map(item => ({
        name: item.name || '',
        description: item.description || null,
        price: item.price || '[Preço Vazio]',
        image: item.image || null,
        available: item.available !== false
      }))
    };
  },

  async fetchSections() {
    const { data, error } = await supabase
      .from('sections')
      .select('*')
      .order('order', { ascending: true });

    if (error) throw error;
    if (!data || data.length === 0) return [];

    return data.map(row => this.normalizeSection(row));
  },

  onMenuChange(callback) {
    const channel = supabase
      .channel('menu-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sections' }, () => {
        this.fetchSections()
          .then(sections => callback(sections))
          .catch(err => {
            console.error('Menu listener error:', err);
            callback(null);
          });
      })
      .subscribe();

    return channel;
  },

  async saveSection(section) {
    const { error } = await supabase
      .from('sections')
      .upsert({
        id: section.id,
        title: section.title,
        type: section.type,
        order: section.order,
        items: section.items.map(item => ({
          name: item.name,
          description: item.description || null,
          price: item.price,
          image: item.image || null,
          available: item.available
        })),
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' });

    if (error) throw error;
  },

  async deleteSection(sectionId) {
    const { error } = await supabase
      .from('sections')
      .delete()
      .eq('id', sectionId);

    if (error) throw error;
  },

  async updateSectionItems(sectionId, items) {
    const { error } = await supabase
      .from('sections')
      .update({
        items,
        updated_at: new Date().toISOString()
      })
      .eq('id', sectionId);

    if (error) throw error;
  },

  generateSectionId(title) {
    return title
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  },

  async getNextOrder() {
    const { data, error } = await supabase
      .from('sections')
      .select('order')
      .order('order', { ascending: false })
      .limit(1);

    if (error) throw error;
    if (!data || data.length === 0) return 0;
    return (data[0].order || 0) + 1;
  }
};
