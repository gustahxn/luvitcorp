# LuvitCorp - Guia de Instalação e Execução

Este guia contém as instruções para rodar a aplicação Full-Stack (Frontend React + Backend Express + Supabase) localmente ou através do **Docker**.

---

## 🐋 1. Rodando com Docker (Recomendado)

A forma mais rápida de rodar o projeto sem precisar instalar Node.js localmente é usando o Docker.

### Pré-requisitos
- [Docker](https://www.docker.com/) instalado.
- [Docker Compose](https://docs.docker.com/compose/) instalado.

### Configuração
1.  Garanta que os arquivos `.env` existam na pasta `backend/` e `frontend/` com as chaves do Supabase.
2.  No terminal da raiz do projeto, execute:
    ```bash
    docker-compose up --build
    ```
3.  **Frontend**: [http://localhost](http://localhost) (Porta 80)
4.  **Backend**: [http://localhost:3001/api](http://localhost:3001/api)

---

## 💻 2. Rodando Localmente (Sem Docker)

Se preferir rodar nativamente, siga os passos abaixo:

### Pré-requisitos
- Node.js (v18+) e NPM.

### Passo 1: Backend (API)
1.  `cd backend`
2.  `npm install`
3.  `npm run dev` (Rodará em `http://localhost:3001`)

### Passo 2: Frontend (React)
1.  `cd frontend`
2.  `npm install`
3.  `npm run dev` (Rodará em `http://localhost:5173`)

---

## 🔑 Configurações do Banco (Supabase)

Ambos os métodos exigem um projeto no [Supabase](https://supabase.com). 
Certifique-se de aplicar o arquivo `supabase/schema.sql` no SQL Editor do seu projeto para criar as tabelas e políticas de segurança.

---

## 🛠️ Tecnologias Utilizadas
- **Frontend**: React, Vite, Nginx (no Docker).
- **Backend**: Node.js, Express.
- **Banco**: Supabase (Auth, Database, Storage).
- **Container**: Docker + Docker Compose.

---

## Administradores
Para criar o primeiro admin, você pode rodar o script na pasta do backend:
`node seed-admin.js`
ou usar os comandos SQL fornecidos no guia de dockerização.
