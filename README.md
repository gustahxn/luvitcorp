

##  1. Docker

A forma mais rápida e segura de rodar o projeto sem precisar instalar Node.js localmente é usando o Docker.

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

## 2. Tecnologias Utilizadas
- **Frontend**: React, Vite, Nginx (no Docker).
- **Backend**: Node.js, Express.
- **Banco**: Supabase (Auth, Database, Storage).
- **Container**: Docker + Docker Compose.


