
# Repositório de Website

# 🚀 Deploy (pull-based — ninguém precisa buildar)

Os scripts **não buildam e não fazem push**: as imagens vêm prontas do Docker Hub.
Requisitos de quem deploya: `bash`, `ssh`/`scp`, a chave PEM e um clone do repo
(compose + `src/database/scriptBd.sql`). **Docker local não é necessário.**

```bash
# Site Node (pull da imagem + sobe node e mysql)
bash deploy.sh <IP_EC2>

# Serviço Java de alertas (pull da imagem Java)
bash deployjava.sh <IP_EC2>            # + --run-backfill para backfill único
```

- Build/publish das imagens é exclusivo do mantenedor: `bash build-and-push.sh`
  (faz sanity check antes do push, inclusive do `jiraAlertaModel.js`).
- Defina `NODE_IMAGE` no `.env` com o reposit?rio da imagem Node, sem a tag. O build e o Compose usam esse valor.
- Ambiente de deploy: `.env` (ver `.env.example`) → os scripts geram
  `deploy.env` (Node) e `deploy-java.env` (Java), separados.
- **Rollback por tag**: fixe `NODE_IMAGE_TAG` (node) e/ou `JAVA_IMAGE_TAG`
  no `.env` com uma tag versionada e rode o deploy de novo.
- `deploy.sh` não mexe em git (`git pull` removido): atualize o clone antes
  de deployar.

# 🛠️ funcionamento 🛠️

 Esse repositório concentra a maior parte do Login, permissionamento e interação que o usuário terá com o sistema
 <br>
 <br>



# 🔧 Tecnologias Utilizadas 🔧
### ![HTML5](https://img.shields.io/badge/html5-%23E34F26.svg?style=for-the-badge&logo=html5&logoColor=white) ![CSS3](https://img.shields.io/badge/css3-%231572B6.svg?style=for-the-badge&logo=css3&logoColor=white) ![JavaScript](https://img.shields.io/badge/javascript-%23323330.svg?style=for-the-badge&logo=javascript&logoColor=%23F7DF1E) ![Chart.js](https://img.shields.io/badge/Chart.js-FF6384?style=for-the-badge&logo=chartdotjs&logoColor=white)





## 👥 Equipe 👥

**Fernanda Leal**<br>
**Gabriel Galhiardo**<br>
**Marcos Paulo**<br>
**Matheus Lourenço**<br>
**Matheus Jacob**<br>
**Thaís Ramos**<br>