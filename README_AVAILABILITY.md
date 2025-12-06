# Gerenciamento de Disponibilidade de Itens

Este script Python permite gerenciar facilmente a disponibilidade dos itens do cardápio.

## 📋 Requisitos

- Python 3.6 ou superior

## 🚀 Uso

### Ver estatísticas do cardápio

```bash
python3 manage_availability.py stats
```

Mostra quantos itens estão disponíveis/indisponíveis por categoria.

### Listar todos os itens

```bash
python3 manage_availability.py list
```

Lista todos os itens do cardápio com seu status (✅ disponível / ❌ indisponível).

### Marcar item como indisponível

```bash
python3 manage_availability.py unavailable "Nome do Item"
```

**Exemplo:**
```bash
python3 manage_availability.py unavailable "Bobó de camarão (arroz branco, farofa de biscoito)"
```

### Marcar item como disponível

```bash
python3 manage_availability.py available "Nome do Item"
```

**Exemplo:**
```bash
python3 manage_availability.py available "Bobó de camarão (arroz branco, farofa de biscoito)"
```

## 💡 Exemplos Práticos

### Cenário 1: Camarão acabou

```bash
# Marcar todos os pratos com camarão como indisponíveis
python3 manage_availability.py unavailable "Pastel de camarão (8 unid.)"
python3 manage_availability.py unavailable "Salada de camarão (molho caesar)"
python3 manage_availability.py unavailable "Moqueca com camarão e peixe (arroz de coentro, farofa de dendê)"
python3 manage_availability.py unavailable "Bobó de camarão (arroz branco, farofa de biscoito)"
python3 manage_availability.py unavailable "Risoto de camarão (molho bisque de de camarão e queijo)"
python3 manage_availability.py unavailable "Espaguete com camarão (molho de tomate confit)"

# Verificar o status
python3 manage_availability.py stats
```

### Cenário 2: Camarão voltou ao estoque

```bash
# Marcar todos os pratos com camarão como disponíveis novamente
python3 manage_availability.py available "Pastel de camarão (8 unid.)"
python3 manage_availability.py available "Salada de camarão (molho caesar)"
python3 manage_availability.py available "Moqueca com camarão e peixe (arroz de coentro, farofa de dendê)"
python3 manage_availability.py available "Bobó de camarão (arroz branco, farofa de biscoito)"
python3 manage_availability.py available "Risoto de camarão (molho bisque de de camarão e queijo)"
python3 manage_availability.py available "Espaguete com camarão (molho de tomate confit)"
```

### Cenário 3: Verificar status atual

```bash
# Ver estatísticas gerais
python3 manage_availability.py stats

# Ver lista completa com status
python3 manage_availability.py list
```

## ⚠️ Notas Importantes

1. **Nome exato:** O nome do item deve ser exatamente como aparece no arquivo `data.json`
2. **Aspas:** Use aspas duplas ao redor do nome do item
3. **Recarregar página:** Após fazer alterações, recarregue a página do cardápio para ver as mudanças
4. **Backup:** O script modifica diretamente o arquivo `data/data.json`

## 🔧 Alternativa Manual

Se preferir, você também pode editar o arquivo `data/data.json` diretamente:

1. Abra `data/data.json` em um editor de texto
2. Procure pelo item desejado
3. Altere `"available": true` para `"available": false` (ou vice-versa)
4. Salve o arquivo
5. Recarregue a página do cardápio

## 📊 Saída do Comando Stats

```
📊 ESTATÍSTICAS DO CARDÁPIO

Total de itens: 108
Itens disponíveis: 108 (100.0%)
Itens indisponíveis: 0 (0.0%)

📋 POR CATEGORIA:

Entradas                       | Total:   6 | Disponíveis:   6 | Indisponíveis:   0
Prato Principal                | Total:  15 | Disponíveis:  15 | Indisponíveis:   0
Massas                         | Total:   4 | Disponíveis:   4 | Indisponíveis:   0
...
```

## 🐛 Solução de Problemas

### "Item não encontrado"

- Verifique se o nome está exatamente como no arquivo `data.json`
- Use o comando `list` para ver todos os nomes disponíveis
- Certifique-se de usar aspas ao redor do nome

### "Arquivo não encontrado"

- Certifique-se de estar executando o script na pasta raiz do projeto
- Verifique se o arquivo `data/data.json` existe

## 📚 Documentação Adicional

Para mais informações sobre o sistema de disponibilidade, consulte:
- `availability_feature.md` - Documentação técnica completa
- `quick_guide.md` - Guia rápido com exemplos práticos
