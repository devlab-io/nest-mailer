```text
███╗   ██╗███████╗███████╗████████╗    ███╗   ███╗ █████╗ ██╗██╗     ███████╗██████╗ 
████╗  ██║██╔════╝██╔════╝╚══██╔══╝    ████╗ ████║██╔══██╗██║██║     ██╔════╝██╔══██╗
██╔██╗ ██║█████╗  ███████╗   ██║       ██╔████╔██║███████║██║██║     █████╗  ██████╔╝
██║╚██╗██║██╔══╝  ╚════██║   ██║       ██║╚██╔╝██║██╔══██║██║██║     ██╔══╝  ██╔══██╗
██║ ╚████║███████╗███████║   ██║       ██║ ╚═╝ ██║██║  ██║██║███████╗███████╗██║  ██║
╚═╝  ╚═══╝╚══════╝╚══════╝   ╚═╝       ╚═╝     ╚═╝╚═╝  ╚═╝╚═╝╚══════╝╚══════╝╚═╝  ╚═╝
```

# @devlab-io/nest-mailer

NestJS module providing email sending services using Resend or SMTP.

## Installation

This package is distributed via GitHub Packages (private npm registry).
Install it using npm or yarn.

### Authentication to Github Packages

Since this is a private package, you need to configure authentication:

1. **Generate a GitHub Personal Access Token**:
	- Go to https://github.com/settings/tokens
	- Create a new token with the following permissions:
		- `read:packages` - to download packages
		- `repo` - if the repository is private

2. **Configure npm/yarn to use GitHub Packages**:

	Create or edit `.npmrc` file in your project root (or `~/.npmrc` for global configuration):
	```ini
	@devlab-io:registry=https://npm.pkg.github.com
	//npm.pkg.github.com/:_authToken=YOUR_GITHUB_TOKEN
	```

	Or configure via command line:
	```bash
	# For npm
	npm config set @devlab-io:registry https://npm.pkg.github.com
	npm config set //npm.pkg.github.com/:_authToken YOUR_GITHUB_TOKEN

	# For yarn
	yarn config set @devlab-io:registry https://npm.pkg.github.com
	yarn config set //npm.pkg.github.com/:_authToken YOUR_GITHUB_TOKEN
	```

	Using environment variable (recommended for CI/CD):
	```bash
	# Set the token as environment variable
	export NPM_TOKEN=YOUR_GITHUB_TOKEN

	# Then in .npmrc:
	@devlab-io:registry=https://npm.pkg.github.com
	//npm.pkg.github.com/:_authToken=${NPM_TOKEN}
	```

### Actual installation

3. **Install the Package**:

	Using npm:
	```bash
	# Install the package
	npm install @devlab-io/nest-mailer

	# Install the provider you want to use (choose one or both):
	# For Resend
	npm install resend

	# For SMTP
	npm install nodemailer @types/nodemailer
	```

	Using yarn:
	```bash
	# Install the package
	yarn add @devlab-io/nest-mailer

	# Install the provider you want to use (choose one or both):
	# For Resend
	yarn add resend

	# For SMTP
	yarn add nodemailer @types/nodemailer
	```

	Or add directly in `package.json`:
	```json
	{
		"dependencies": {
			"@devlab-io/nest-mailer": "^1.0.0",
			"resend": "^3.2.0"
			// OR
			"nodemailer": "^6.9.8",
			"@types/nodemailer": "^6.4.14"
		}
	}
	```

	To see available versions, check the [releases page](https://github.com/devlab-io/nest-mailer/releases) or the [GitHub Packages page](https://github.com/orgs/devlab-io/packages/npm/package/nest-mailer).

### Github Actions

4. **Autoriser un autre repertoire Gihub à utiliser la bibliothèque**

	Il faut aller dans les [paramètres du package](https://github.com/orgs/devlab-io/packages/npm/nest-mailer/settings) et autoriser le repertoire qui utilise la bibliothèque:
	- Cliquer sur "Add Repository"
	- Choisir le repository à ajouter
	- Cliquer sur "Add Repository"

### Dockerfile du projet utilisant la bibliothèque

Pour utiliser cette bibliothèque dans un projet Docker, vous devez configurer l'authentification GitHub Packages avec des secrets Docker. Voici comment procéder :

**Étape 1 : Créer un Dockerfile avec secrets**

	Créez un `Dockerfile` qui utilise les secrets Docker pour configurer l'authentification :
	```dockerfile
	FROM node:20-alpine AS builder

	# Définir le répertoire de travail
	WORKDIR /app

	# Configurer .npmrc avec le secret GitHub Token
	RUN --mount=type=secret,id=GITHUB_TOKEN \
		if [ -f /run/secrets/GITHUB_TOKEN ]; then \
		GITHUB_TOKEN=$(cat /run/secrets/GITHUB_TOKEN) && \
		echo "@devlab-io:registry=https://npm.pkg.github.com" > .npmrc && \
		echo "//npm.pkg.github.com/:_authToken=$GITHUB_TOKEN" >> .npmrc; \
		fi

	# Copier les fichiers de configuration
	COPY package.json yarn.lock ./

	# Installer les dépendances
	RUN yarn install --frozen-lockfile

	# Copier le reste du code
	COPY . .

	# Build de l'application
	RUN yarn build

	# Stage de production
	FROM node:20-alpine AS production

	WORKDIR /app

	# Recréer .npmrc avec le secret pour les dépendances de production
	RUN --mount=type=secret,id=GITHUB_TOKEN \
		if [ -f /run/secrets/GITHUB_TOKEN ]; then \
		GITHUB_TOKEN=$(cat /run/secrets/GITHUB_TOKEN) && \
		echo "@devlab-io:registry=https://npm.pkg.github.com" > .npmrc && \
		echo "//npm.pkg.github.com/:_authToken=$GITHUB_TOKEN" >> .npmrc; \
		fi

	# Copier les fichiers nécessaires
	COPY package.json yarn.lock ./
	COPY --from=builder /app/dist ./dist

	# Installer uniquement les dépendances de production
	RUN yarn install --frozen-lockfile --production

	# Supprimer .npmrc après installation (sécurité)
	RUN rm -f .npmrc

	# Exposer le port
	EXPOSE 3000

	# Lancer l'application
	CMD ["node", "dist/main.js"]
	```

**Étape 2 : Créer un fichier `.dockerignore`**

	Créez un `.dockerignore` pour exclure les fichiers inutiles :
	```
	node_modules
	dist
	.git
	.env
	.env.local
	coverage
	*.log
	```

**Étape 3 : Utiliser Docker Build avec secrets**

	Pour passer le token GitHub de manière sécurisée, utilisez les secrets Docker :

	```bash
	# Build avec secret depuis une variable d'environnement
	export GITHUB_TOKEN=ghp_xxxxxxxxxxxxx
	docker build \
		--secret id=GITHUB_TOKEN,env=GITHUB_TOKEN \
		-t my-app:latest .
	```

Ou avec un fichier de secret :
	```bash
	# Créer un fichier secret.txt avec votre token
	echo "ghp_xxxxxxxxxxxxx" > secret.txt

	# Build en utilisant le fichier secret
	docker build \
		--secret id=GITHUB_TOKEN,src=secret.txt \
		-t my-app:latest .

	# Nettoyer le fichier secret après le build
	rm secret.txt
	```

Ou depuis un fichier `.env` :
	```bash
	# Créer un fichier .env avec votre token
	# GITHUB_TOKEN=ghp_xxxxxxxxxxxxx

	# Build en lisant depuis .env
	export $(grep -v '^#' .env | xargs)
	docker build \
		--secret id=GITHUB_TOKEN,env=GITHUB_TOKEN \
		-t my-app:latest .
	```

**Étape 4 : Configuration Docker Compose**

	Créez un `docker-compose.yml` :

	```yaml
	version: '3.8'

	services:
		app:
		build:
			context: .
			secrets:
			- GITHUB_TOKEN
		environment:
			# Variables d'environnement pour le mailer
			RESEND_API_KEY: ${RESEND_API_KEY}
			# OU pour SMTP
			SMTP_HOST: ${SMTP_HOST:-localhost}
			SMTP_PORT: ${SMTP_PORT:-2500}
			SMTP_SECURE: ${SMTP_SECURE:-false}
			SMTP_IGNORE_TLS: ${SMTP_IGNORE_TLS:-true}
			SMTP_USER: ${SMTP_USER:-}
			SMTP_PASS: ${SMTP_PASS:-}
			EMAIL_FROM: ${EMAIL_FROM:-no-reply@example.com}
		ports:
			- "3000:3000"

	secrets:
		GITHUB_TOKEN:
		environment: GITHUB_TOKEN
	```

**Étape 5 : Créer un fichier `.env` pour Docker Compose**

	Créez un `.env` à la racine de votre projet :
	```env
	# GitHub Packages Token
	GITHUB_TOKEN=ghp_xxxxxxxxxxxxx

	# Mailer Configuration (Resend)
	RESEND_API_KEY=re_xxxxxxxxxxxxx
	EMAIL_FROM=noreply@example.com

	# OU Mailer Configuration (SMTP)
	# SMTP_HOST=smtp.example.com
	# SMTP_PORT=587
	# SMTP_SECURE=false
	# SMTP_IGNORE_TLS=false
	# SMTP_USER=user@example.com
	# SMTP_PASS=password123
	# EMAIL_FROM=noreply@example.com
	```

**Étape 6 : Lancer avec Docker Compose**

	```bash
	# Lancer le service
	docker-compose up -d

	# Voir les logs
	docker-compose logs -f app

	# Arrêter le service
	docker-compose down
	```

**Notes importantes :**

	- ⚠️ **Ne commitez jamais** votre fichier `.env` avec les tokens
	- ⚠️ **Ne commitez jamais** de fichiers contenant des tokens (secret.txt, etc.)
	- ✅ Utilisez les secrets Docker (`--mount=type=secret`) pour une sécurité maximale
	- ✅ Les secrets ne sont jamais inclus dans l'image finale
	- ✅ Ajoutez `.env` et `secret.txt` à votre `.gitignore`
	- ✅ Pour la production, utilisez un gestionnaire de secrets (AWS Secrets Manager, HashiCorp Vault, etc.)


## Usage

### Basic Setup

Import and configure the module in your `AppModule`:

```typescript
import { Module } from '@nestjs/common';
import { MailerModule } from '@devlab-io/nest-mailer';

@Module({
	imports: [
		MailerModule.forRoot({
			// Resend Configuration
			resend: {
				apiKey: 're_xxxxxxxxxxxxx',
			},
			mailer: {
				from: 'noreply@example.com',
			},
			// OR SMTP Configuration
			// smtp: {
			// 	host: 'smtp.example.com',
			// 	port: 587,
			// 	secure: false,
			// 	ignoreTLS: false,
			// 	auth: {
			// 		user: 'user@example.com',
			// 		pass: 'password',
			// 	},
			// },
			// mailer: {
			// 	from: 'noreply@example.com',
			// },
		}),
	],
})
export class AppModule {}
```

### Using Environment Variables

If you don't provide a configuration, the module will automatically read from environment variables:

```typescript
import { Module } from '@nestjs/common';
import { MailerModule } from '@devlab-io/nest-mailer';

@Module({
	imports: [MailerModule.forRoot()],
})
export class AppModule {}
```

Environment variables:
- `RESEND_API_KEY` - Resend API key (if set, uses Resend instead of SMTP)
- `SMTP_HOST` - SMTP host (default: `localhost`)
- `SMTP_PORT` - SMTP port (default: `2500`)
- `SMTP_SECURE` - Use secure connection (default: `false`)
- `SMTP_IGNORE_TLS` - Ignore TLS certificate (default: `true`)
- `SMTP_USER` - SMTP username (optional)
- `SMTP_PASS` - SMTP password (optional)
- `EMAIL_FROM` - Default sender email address (default: `no-reply@resend.devlab.io`)

### Injecting the Mailer Service

```typescript
import { Injectable, Inject } from '@nestjs/common';
import { MailerService, MailerServiceToken } from '@devlab-io/nest-mailer';

@Injectable()
export class MyService {
	constructor(
		@Inject(MailerServiceToken)
		private readonly mailerService: MailerService,
	) {}

	async sendWelcomeEmail(userEmail: string, userName: string) {
		await this.mailerService.send(
			userEmail,
			'Welcome!',
			`Hello ${userName}, welcome to our platform!`,
		);
	}

	async sendPasswordResetEmail(userEmail: string, resetToken: string) {
		await this.mailerService.send(
			userEmail,
			'Password Reset',
			`Your password reset token is: ${resetToken}`,
		);
	}
}
```

## API

### MailerService

```typescript
interface MailerService {
	send(to: string, subject: string, text: string): Promise<void>;
}
```

### Types

```typescript
interface MailerConfig {
	resend?: {
		apiKey: string;
	};
	smtp?: {
		host: string;
		port: number;
		secure: boolean;
		ignoreTLS: boolean;
		auth?: {
			user: string;
			pass: string;
		};
	};
	mailer: {
		from: string;
	};
}
```

## Development

### Commandes utiles pour contribuer au devellopement de la lib

```bash
# Install dependencies
yarn install

# Build
yarn run build

# Type check
yarn run type-check

# Format code
yarn run format

# Lint
yarn run lint
```

## Publishing

Le projet utilise un workflow Git Flow automatisé via GitHub Actions pour publier la bibliothèque.

### Publier une nouvelle version

1. **Via GitHub Actions** :
	- Allez dans l'onglet "Actions" de votre repository GitHub
	- Sélectionnez le workflow "Publish to GitHub Packages"
	- Cliquez sur "Run workflow"
	- Sélectionnez la branche `develop` (requis)
	- Entrez les informations suivantes :
		- **Version tag** : La version à publier (ex: `v1.0.1` ou `1.0.1`)
		- **Release description** : Description de la release (sera utilisée pour le tag et la release GitHub)
	- Cliquez sur "Run workflow"

2. **Le workflow va automatiquement** :
	- ✅ Checkout et pull de `develop`
	- ✅ Merge de `develop` dans `main`
	- ✅ Checkout et pull de `main`
	- ✅ Installation des dépendances
	- ✅ Build du package
	- ✅ Vérification du formatage (Prettier)
	- ✅ Vérification du linting (ESLint)
	- ✅ Vérification des types TypeScript
	- ✅ Exécution des tests
	- ✅ Mise à jour de la version dans `package.json`
	- ✅ Commit et push de la mise à jour de version sur `main`
	- ✅ Création et push du tag git
	- ✅ Création des archives (`.tar.gz` et `.zip`)
	- ✅ Publication sur GitHub Packages
	- ✅ Création de la release GitHub avec les archives
	- ✅ Merge de `main` dans `develop`
	- ✅ Push de `develop`

**Important** :
- Le workflow ne peut être déclenché que depuis la branche `develop`
- La branche `main` ne peut être modifiée que par ce workflow
- Si un des checks (format, lint, type-check, tests) échoue, la publication est annulée
- Les archives sont automatiquement attachées à la release GitHub

### Vérifier la publication

Après la publication, vous pouvez vérifier :
- Le package sur [GitHub Packages](https://github.com/orgs/devlab-io/packages/npm/package/nest-mailer)
- La release sur [GitHub Releases](https://github.com/devlab-io/nest-mailer/releases)

## License

**PROPRIETARY LICENSE**

Copyright (c) 2024 DevLab.io

All rights reserved.

This software and associated documentation files (the "Software") are the exclusive property of DevLab.io. 

**RESTRICTIONS:**

1. This Software is proprietary and confidential.
2. Unauthorized copying, modification, distribution, or use of this Software, via any medium, is strictly prohibited.
3. This Software may only be used by DevLab.io and its authorized personnel.
4. Any use of this Software by unauthorized parties is strictly prohibited and may result in legal action.

**NO LICENSE GRANTED:**

No license is granted to any person or entity to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, except as explicitly authorized by DevLab.io in writing.

For licensing inquiries, please contact: devlab.io
