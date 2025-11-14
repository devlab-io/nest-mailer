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
	npm install @devlab-io/nest-mailer
	```

	Using yarn:
	```bash
	yarn add @devlab-io/nest-mailer
	```

	Or add directly in `package.json`:
	```json
	{
		"dependencies": {
			"@devlab-io/nest-mailer": "^1.0.0"
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
