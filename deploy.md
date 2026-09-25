# Deploy para produção

## Frontend (Vercel)

1. Conecte este repositório ao Vercel.
2. Defina a pasta de build como: `dist`
3. Configure a variável de ambiente:
   - `VITE_API_URL=https://SEU_BACKEND_URL/api`
4. O comando de build já está configurado em `package.json`.

## Backend (Render / Railway)

1. Conecte o repositório ao Render.
2. Configure o comando de start:
   - `npm start`
3. Defina as variáveis de ambiente:
   - `PORT=3001`
   - `JWT_SECRET=sua_chave_muito_segura`
4. Exponha a API em HTTPS.

## Banco em produção

Para acesso público, prefira PostgreSQL em vez de SQLite.

### Dados locais demo
- Usuário demo:
  - Email: `admin@ecoviva.com`
  - Senha: `admin123`

## Exemplo de URL final

- Frontend: `https://ecoviva-app.vercel.app`
- Backend: `https://ecoviva-api.onrender.com`
- API final: `https://ecoviva-api.onrender.com/api`

## Observações

- Para uso real, o backend deve estar com HTTPS e banco externo.
- O frontend pode continuar usando rota relativa localmente (`/api`).
- Em produção, use `VITE_API_URL` para apontar para a API pública.
