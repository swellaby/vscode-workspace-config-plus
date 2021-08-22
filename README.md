# VS Code Workspace Config+

Still a work in progress...
Allows you to define configuration/settings in `*.shared.json` and/or `*.local.json `files (e.g. `.vscode/settings.shared.json`, `.vscode/tasks.local.json`, etc.) so that you can
have some config settings shared with your team across the project, as well as individual local custom and/or overridden config settings.

Be sure any `.vscode/*.local.json` files are excluded from source control (e.g. in your `.gitignore` file), as well as the native VS Code config files (e.g. `.vscode/settings.json`).
