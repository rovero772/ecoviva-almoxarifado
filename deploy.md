# Deploy no Render

O arquivo `render.yaml` configura a aplicação como um único serviço: o Render compila o frontend, o servidor Express entrega os arquivos da pasta `dist` e o SQLite fica em um disco persistente.

1. Entre no [Render](https://render.com/) e escolha **New > Blueprint**.
2. Conecte o repositório `rovero772/ecoviva-almoxarifado`.
3. Antes de criar o serviço, informe `ADMIN_EMAIL` e `ADMIN_PASSWORD` como variáveis secretas. Use uma senha forte e exclusiva.
4. Confirme a criação. O Render fará o build e publicará o endereço HTTPS do serviço.
5. Acesse `https://SEU-SERVICO.onrender.com` e entre com o e-mail e senha definidos no passo 3.

O Blueprint gera `JWT_SECRET` e monta o disco persistente em `/var/data`, onde fica o banco. O serviço e o disco podem ter cobrança no Render; confira o valor exibido antes de confirmar.

Em produção, o usuário demo `admin@ecoviva.com` / `admin123` não é criado. O administrador inicial usa as credenciais secretas configuradas no Render. Não publique essas credenciais no GitHub.
