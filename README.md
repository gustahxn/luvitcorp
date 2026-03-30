# LuvitCorp  - Guia de Instalação e Execução

Este guia contém todas as verificações e comandos necessários para rodar sua aplicação Full-Stack (Frontend com React + Vite, Backend com Express + Supabase) de forma local, do zero.

---

##  Pré-requisitos
Antes de começar, verifique se você possui em sua máquina:
- [Node.js](https://nodejs.org/) (versão LTS recomendada, 18.x ou superior) instalado.
- Um editor de código (como o VS Code).
- O terminal configurado para abrir na pasta raiz do projeto (`luvitcorp`).

---

##  1. Configurando o Servidor Backend (API)

O backend concentra as regras de negócio de produtos e pedidos, fazendo uma ponte segura utilizando a Service Role Key com o banco de dados Supabase.

1. Abra seu terminal na pasta raiz do projeto (`luvitcorp`) e entre no diretório backend:
   ```bash
   cd backend
   ```
2. Baixe e instale as dependências essenciais do pacote de servidor:
   ```bash
   npm install
   ```
3. Garanta que você possui o arquivo de variáveis de ambiente (`.env`) na raiz do diretório `backend` contendo:
   ```env
   PORT=3001
   SUPABASE_URL=Sua_URL_do_Supabase_Aqui
   SUPABASE_SERVICE_ROLE_KEY=Sua_Chave_Service_Aqui
   ```
4. Suba o servidor backend localmente:
   ```bash
   npm run dev
   ```
   > O terminal responderá que a API da LuvitCorp está operando em `http://localhost:3001`. Mantenha esta aba do terminal aberta e em execução.

---

## 📱 2. Configurando o Frontend (Loja e Painel Admin)

A área visual é construída sobre React na velocidade do Vite, também se ligando ao Supabase para gerenciar sessões do usuário e o carrinho de pedidos.

1. Abra **uma nova aba** limpa no seu terminal, e certifique-se que está na pasta raiz.
2. Entre no diretório do Frontend:
   ```bash
   cd frontend
   ```
3. Instale as bibliotecas e pacotes visuais necessários (incluindo `react-hot-toast` para avisos):
   ```bash
   npm install
   ```
4. Garanta que o arquivo `.env` exista na raiz da sub-pasta `frontend/` com suas chaves de acesso ao lado cliente:
   ```env
   VITE_API_URL=http://localhost:3001/api
   VITE_SUPABASE_URL=Sua_URL_do_Supabase_Aqui
   VITE_SUPABASE_ANON_KEY=Sua_Chave_Anon_Aqui
   ```
5. Inicie a visualização do código em modo desenvolvedor:
   ```bash
   npm run dev
   ```
   > O Vite responderá com a porta de acesso do website local, normalmente apontando para `http://localhost:5173` ou `5174`.

## Pronto

Com ambas as abas de terminal ativas (uma lidando com a porta `3001` e a outra lidando com a porta `517X`), bastará você abrir o navegador, colar o `http://localhost:5174` (ou qual porta do VITE estiver no terminal do frontend) e a plataforma LuvitCorp estará 100% online! 
