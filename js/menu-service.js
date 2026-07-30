const menuService = {

  async fetchSections() {
    const snapshot = await db.collection('menu')
      .orderBy('order', 'asc')
      .get();

    if (snapshot.empty) {
      return [];
    }

    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: data.id || doc.id,
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
    });
  },

  onMenuChange(callback) {
    return db.collection('menu')
      .orderBy('order', 'asc')
      .onSnapshot(snapshot => {
        const sections = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: data.id || doc.id,
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
        });
        callback(sections);
      }, error => {
        console.error('Menu listener error:', error);
        callback(null);
      });
  },

  async saveSection(section) {
    const docRef = db.collection('menu').doc(section.id);
    await docRef.set({
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
      }))
    }, { merge: true });
  },

  async deleteSection(sectionId) {
    await db.collection('menu').doc(sectionId).delete();
  },

  async updateSectionItems(sectionId, items) {
    await db.collection('menu').doc(sectionId).update({ items });
  },

  generateSectionId(title) {
    return title
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  },

  async getNextOrder() {
    const snapshot = await db.collection('menu')
      .orderBy('order', 'desc')
      .limit(1)
      .get();
    if (snapshot.empty) return 0;
    return (snapshot.docs[0].data().order || 0) + 1;
  }
};
