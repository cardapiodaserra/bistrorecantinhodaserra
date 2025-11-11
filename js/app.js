function menuApp() {
    return {
        searchQuery: '',
        activeFilter: 'all',
        showFavoritesOnly: false,
        sections: [],
        favorites: [],
        cart: [],
        showCart: false,
        showUserForm: false,
        isLoading: true,
        user: {
            name: '',
            address: '',
            phone: ''
        },
        async init() {
            try {
                this.isLoading = true;
                
                const response = await fetch('data/data.json');
                this.sections = await response.json();
                
                // Carregar favoritos do localStorage
                const savedFavorites = localStorage.getItem('favorites');
                if (savedFavorites) {
                    this.favorites = JSON.parse(savedFavorites);
                }
                
                // Carregar carrinho do localStorage
                const savedCart = localStorage.getItem('cart');
                if (savedCart) {
                    this.cart = JSON.parse(savedCart);
                }
                
                // Carregar dados do usuário
                const savedUser = localStorage.getItem('user');
                if (savedUser) {
                    this.user = JSON.parse(savedUser);
                }
                
                // Simular um delay mínimo para mostrar o loading (melhora UX)
                await new Promise(resolve => setTimeout(resolve, 800));
                
            } catch (error) {
                console.error('Erro ao carregar dados:', error);
                // Erro será exibido no console - usuário pode tentar recarregar a página
            } finally {
                this.isLoading = false;
            }
        },
        get filteredSections() {
            let filtered = this.sections.filter(section => {
                // Filtro por tipo (food/drinks/all)
                if (this.activeFilter !== 'all' && section.type !== this.activeFilter) return false;
                
                // Filtro de favoritos
                if (this.showFavoritesOnly) {
                    return section.items.some(item => this.favorites.includes(item.name));
                }
                
                // Filtro de busca
                if (this.searchQuery === '') return true;
                return section.items.some(item => 
                    item.name.toLowerCase().includes(this.searchQuery.toLowerCase())
                );
            });

            // Se estiver mostrando favoritos, filtrar os itens também
            if (this.showFavoritesOnly) {
                filtered = filtered.map(section => ({
                    ...section,
                    items: section.items.filter(item => this.favorites.includes(item.name))
                }));
            }

            return filtered;
        },
        toggleFavorite(itemName) {
            const index = this.favorites.indexOf(itemName);
            if (index > -1) {
                this.favorites.splice(index, 1);
            } else {
                this.favorites.push(itemName);
            }
            // Salvar no localStorage
            localStorage.setItem('favorites', JSON.stringify(this.favorites));
        },
        isFavorite(itemName) {
            return this.favorites.includes(itemName);
        },
        scrollToSection(sectionId) {
            const element = document.getElementById(`section-${sectionId}`);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        },
        // Funções do Carrinho
        addToCart(item, sectionTitle) {
            const existingItem = this.cart.find(cartItem => cartItem.name === item.name);
            
            if (existingItem) {
                existingItem.quantity += 1;
            } else {
                this.cart.push({
                    name: item.name,
                    price: item.price,
                    category: sectionTitle,
                    quantity: 1
                });
            }
            
            this.saveCart();
        },
        removeFromCart(itemName) {
            const index = this.cart.findIndex(item => item.name === itemName);
            if (index > -1) {
                this.cart.splice(index, 1);
                this.saveCart();
            }
        },
        updateQuantity(itemName, change) {
            const item = this.cart.find(cartItem => cartItem.name === itemName);
            if (item) {
                item.quantity += change;
                if (item.quantity <= 0) {
                    this.removeFromCart(itemName);
                } else {
                    this.saveCart();
                }
            }
        },
        getItemQuantity(itemName) {
            const item = this.cart.find(cartItem => cartItem.name === itemName);
            return item ? item.quantity : 0;
        },
        get cartTotal() {
            return this.cart.reduce((total, item) => {
                const price = parseFloat(item.price.replace('R$', '').replace(',', '.').trim());
                return total + (price * item.quantity);
            }, 0);
        },
        get cartItemCount() {
            return this.cart.reduce((total, item) => total + item.quantity, 0);
        },
        saveCart() {
            localStorage.setItem('cart', JSON.stringify(this.cart));
        },
        clearCart() {
            if (confirm('Deseja limpar todo o carrinho?')) {
                this.cart = [];
                this.saveCart();
            }
        },
        // Funções do Usuário
        get isUserIdentified() {
            return this.user.name && this.user.address;
        },
        saveUser() {
            localStorage.setItem('user', JSON.stringify(this.user));
        },
        finalizarPedido() {
            // Sempre abre o modal para confirmar/atualizar o local (mesa ou endereço)
            this.showCart = false;
            this.showUserForm = true;
        },
        submitUserForm() {
            if (this.user.name && this.user.address) {
                this.saveUser();
                this.showUserForm = false;
                this.enviarPedido();
            }
            // Se os campos não estiverem preenchidos, o HTML já valida com 'required'
        },
        enviarPedido() {
            const mensagem = this.gerarMensagemPedido();
            
            // Número do WhatsApp do Bistrô (formato internacional sem + e sem espaços)
            // Exemplo: 5511999999999 (55 = Brasil, 11 = DDD, 999999999 = número)
            const numeroWhatsApp = '558381157571'; // SUBSTITUA pelo número real do bistrô
            
            // Codificar a mensagem para URL
            const mensagemCodificada = encodeURIComponent(mensagem);
            
            // Criar link do WhatsApp
            const linkWhatsApp = `https://wa.me/${numeroWhatsApp}?text=${mensagemCodificada}`;
            
            // Abrir WhatsApp em nova aba
            window.open(linkWhatsApp, '_blank');
            
            // Limpar carrinho após envio
            this.cart = [];
            this.saveCart();
            this.showCart = false;
        },
        gerarMensagemPedido() {
            let msg = `*PEDIDO - Bistrô Recantinho da Serra*\n\n`;
            msg += `*Cliente:* ${this.user.name}\n`;
            msg += `*Local:* ${this.user.address}\n`;
            if (this.user.phone) {
                msg += `*Telefone:* ${this.user.phone}\n`;
            }
            msg += `\n*ITENS:*\n`;
            
            this.cart.forEach(item => {
                msg += `\n${item.quantity}x ${item.name.split('<span')[0]}\n`;
                msg += `   ${item.price} cada\n`;
                msg += `   Categoria: ${item.category}\n`;
            });
            
            msg += `\n*TOTAL: R$ ${this.cartTotal.toFixed(2).replace('.', ',')}*`;
            
            return msg;
        },
        editarDadosUsuario() {
            this.showUserForm = true;
        }
    }
}