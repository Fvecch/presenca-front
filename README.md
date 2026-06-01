# 🎓 Sistema de Presença Escolar — Front-end

Interface web do sistema de controle de frequência escolar, construída com **React** e **Vite**, consumindo a API em Python/FastAPI.

🔗 **Site em produção:** [presenca-front.vercel.app](https://presenca-front.vercel.app)
⚙️ **Repositório da API:** [github.com/Fvecch/sistema-presenca-ddd](https://github.com/Fvecch/sistema-presenca-ddd)

---

## ✨ Funcionalidades

- 📋 **Listagem de diários** com data, curso e status de cada aluno
- ➕ **Nova chamada** com seleção de curso, data e presença por aluno
- ✏️ **Editar data** de um diário existente
- 🗑️ **Excluir** diário ou remover aluno da chamada
- 📄 **Justificar falta** com motivo e validação de prazo (5 dias)
- 📊 **Painel de estatísticas** com total de diários, registros, presentes, ausentes e justificados
- ⚙️ **Catálogo** para gerenciar cursos e alunos
- 📱 **Layout responsivo** para desktop e mobile
- 🔔 **Notificações toast** para feedback de ações

---

## 🏗️ Estrutura do Projeto

```
presenca-front/
│
├── src/
│   ├── App.jsx       # Componente principal com toda a lógica e UI
│   ├── index.css     # Animações globais (spin, slideIn)
│   └── main.jsx      # Ponto de entrada do React
│
├── index.html        # HTML base
├── vite.config.js    # Configuração do Vite
└── package.json      # Dependências
```

---

## 🚀 Como executar localmente

### 1. Pré-requisitos
- Node.js 18+
- API do back-end rodando (local ou no Render)

### 2. Instalar dependências

```bash
npm install
```

### 3. Rodar em desenvolvimento

```bash
npm run dev
```

O front estará disponível em `http://localhost:5173`.

### 4. Build para produção

```bash
npm run build
```

---

## ⚙️ Configuração da API

A URL da API está definida diretamente no `App.jsx`:

```js
const API = "https://sistema-presenca-ddd-t85n.onrender.com";
```

Para usar uma API local, substitua por:

```js
const API = "http://localhost:8000";
```

---

## 🛠️ Tecnologias

| Tecnologia | Uso |
|---|---|
| **React 19** | Framework de UI |
| **Vite** | Bundler e servidor de desenvolvimento |
| **Fetch API** | Comunicação com a API REST |
| **Vercel** | Deploy em produção |
