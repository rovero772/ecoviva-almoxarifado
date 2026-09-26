# Ecoviva Almoxarifado

Sistema de controle de almoxarifado para construção civil, com foco em gestão de materiais, entradas, saídas, estoque, solicitações e relatórios operacionais.

## Visão geral

O Ecoviva foi pensado para uso diário por almoxarifes, gestores de obra e equipes de engenharia. O sistema permite:

- cadastrar materiais e categorias
- registrar entradas e saídas de estoque
- acompanhar níveis de estoque e alertas
- controlar fornecedores e obras
- registrar solicitações de materiais
- consultar histórico de movimentações
- operar em dispositivos móveis com interface responsiva
- funcionar como PWA para instalação em celular

## Tecnologias

- React + Vite
- Express.js
- SQLite (ambiente local/demo)
- JWT para autenticação
- CSS responsivo para mobile e desktop

## Funcionalidades principais

- Dashboard com indicadores de estoque
- Cadastro de materiais
- Registro de entradas e saídas
- Controle de estoque por status
- Solicitações de materiais
- Gerenciamento de fornecedores e obras
- Usuários com níveis de acesso
- Histórico de movimentações
- PWA para uso no celular

## Requisitos

- Node.js 18+
- npm

## Instalação local

1. Clone o repositório:

```bash
git clone https://github.com/SEU_USUARIO/ecoviva-almoxarifado.git
cd ecoviva-almoxarifado
```

2. Instale as dependências:

```bash
npm install
```

3. Inicie o backend e o frontend em desenvolvimento:

```bash
npm run dev
```

4. Acesse:

- Frontend: http://localhost:5173
- Backend: http://localhost:3001

## Usuário de demonstração

- E-mail: admin@ecoviva.com
- Senha: admin123

## Scripts disponíveis

```bash
npm run dev
npm run build
npm run start
npm run seed
```

## Estrutura do projeto

```text
.
├── server/
│   ├── db.js
│   ├── demoData.js
│   ├── index.js
│   ├── schema.js
│   └── seed.js
├── src/
│   ├── App.jsx
│   ├── main.jsx
│   └── styles.css
├── index.html
├── manifest.webmanifest
├── package.json
├── vite.config.js
├── .env.example
├── deploy.md
├── .gitignore
└── README.md
```

## Deploy

O projeto foi preparado para deploy em serviços públicos. Consulte o arquivo [deploy.md](deploy.md) para instruções detalhadas.

## Observações

- O ambiente local usa SQLite e dados de demonstração.
- Para produção pública, o ideal é migrar para PostgreSQL e publicar backend e frontend em serviços externos.
- O sistema foi estruturado para evoluir com relatórios, QR Code, leitura de código de barras, integrações e alertas.

## Licença

Este projeto foi desenvolvido para fins de demonstração e uso interno em ambiente de obra.
