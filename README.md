# VS Code Workspace Config+

Provides additional capabilities to manage your workspace configuration, including the ability to utilize `shared` and `local` versions of the VS Code workspace configuration files.

---

**Functional, but still in Beta !!!!**

---

[![Version Badge][version-badge]][ext-url]
[![Installs Badge][installs-badge]][ext-url]
[![Rating Badge][rating-badge]][ext-url]
[![License Badge][license-badge]][license-url]

[![Linux CI Badge][linux-ci-badge]][linux-ci-url]
[![Mac CI Badge][mac-ci-badge]][mac-ci-url]
[![Windows CI Badge][windows-ci-badge]][windows-ci-url]

[![Test Results Badge][tests-badge]][tests-url]
[![Coverage Badge][coverage-badge]][coverage-url]
[![Sonar Quality GateBadge][quality-gate-badge]][sonar-project-url]

## Current Features

- Adds support for `shared` and `local` configuration files (`.vscode/*.shared.json`, and `.vscode/*.local.json`)

### Shared and Local Configuration Files

With this extension you can now split your project's workspace configuration between shared files that can be checked into version control and shared with other team members, as well as local configuration overrides/extension that are excluded from version control.

It currently supports:

- `settings.json` - (`settings.shared.json`, `settings.local.json`)
- `tasks.json` - (`tasks.shared.json`, `tasks.local.json`)
- `launch.json` - (`launch.shared.json`, `launch.local.json`)

#### Setup

Be sure your `*.local.json` files and the main VS Code files are excluded from version control by adding the corresponding entries to your project's ignore file (e.g. `.gitignore`, `.hgignore`). For example:

```
# .gitignore
.vscode/settings.json
.vscode/settings.local.json
```

Then just add your desired `*.shared.json` and/or `*.local.json` files to your `.vscode` directory in your workspace folder(s). The extension works with both standard (single root) workspace projects and [multi root workspaces][multi-root-workspace-docs].

Enter the values that you want to share with other contributors into the `*.shared.json` file, and any personal/local overrides and additional settings to the corresponding `*.local.json` file. The configuration values defined in a `*.local.json` file will take precedence over any conflicting values defined in the corresponding `*.shared.json` file.

The extension will re-evaluate and, if necessary, automatically apply any configuration updates any time any supported `*.shared.json` or `*.local.json` files are added, modified, or removed, as well as when additional folders are added to a workspace. As such you never have to worry about running any commands! 

This extension is not an all-or-nothing proposition. Team members and contributors that want to take advantage of the shared configuration defined in the `*.shared.json` files only need to have this extension installed and enabled. Any contributor that _doesn't_ want to pull in any of the project's shared configuration can either not install or disable this extension, or they can create a corresponding `*.local.json` file to override the shared settings.

[multi-root-workspace-docs]: https://code.visualstudio.com/docs/editor/multi-root-workspaces

#### Limitations

All configuration setting values are ultimately stored and persisted in the native VS Code workspace configuration files (e.g. `.vscode/settings.json`). However, because these features are added via an extension there are some associated limitations and accordingly we'd strongly advise against manually modifying those native files when using the extension, and instead advise managing your configuration in the shared/local files. 

- You can utilize inline comments in the `*.local.json` and `*.shared.json` files, but any comments from those files are not persisted into the native VS Code configuration file.
- Any comments added to the native VS Code configuration file (e.g. `settings.json`) will be lost when any configuration updates are applied based on changes to the local/shared files.
  - Some other extensions may automatically add configuration values to the native files with comments, so we'd advise moving any such configuration values to the corresponding `*.local.json` or `*.shared.json` file if you'd like to maintain the comments.
- The extension does _not_ monitor any changes made to the native VS Code configuration files (e.g. `settings.json`), so if you manually modify a value in one of those files then that takes precedence with VS Code.
    - If you mistakenly modify the native file, the easiest way to trigger this extension to correct the configuration is to modify the corresponding shared or local file (e.g. add a blank line and then save).
- This extension only works with the workspace configuration files, and doesn't allow for configuration values to be edited in the [VS Code Settings Editor][vscode-settings-editor-docs] interface.
- We've tested and validated the extension with both single and [multi-root workspace][vscode-multiroot-docs] projects. We have _not_ had a chance to test with [VS Code Remote SSH]vscode-ssh-docs] based workspaces, nor browser-based workspaces like [GitHub Codespaces][github-codespaces-docs]. We don't necessarily expect any particular issues in those types of projects, but just haven't been able to test and validate (if you do, and want to test, please let us know!)
- Our understanding is that you will not be able to sync your `*.local.json` files if you are a user of the native [VS Code Settings Sync][vscode-settings-sync] feature. However, the [Settings Sync Extension][settings-sync-ext] may support synchronizing the `*.local.json` configuration files too.


[vscode-settings-editor-docs]: https://code.visualstudio.com/docs/getstarted/settings#_settings-editor
[vscode-multiroot-docs]: https://code.visualstudio.com/docs/editor/multi-root-workspaces
[vscode-ssh-docs]: https://code.visualstudio.com/docs/remote/ssh
[github-codespaces-docs]: https://github.com/features/codespaces
[vscode-settings-sync]: https://code.visualstudio.com/docs/editor/settings-sync
[settings-sync-ext]: https://marketplace.visualstudio.com/items?itemName=Shan.code-settings-sync

#### Background

VS Code is highly configurable, and allows you to [configure specific workspaces in addition to your global user settings.]([vscode-settings-docs]). This includes things like general settings, such as the zoom level, as well as [tasks and launch configurations] amongst others. These configurations are stored in various respective files within the `.vscode` directory in the workspace. For example, the workspace task configuration is stored in `.vscode/tasks.json`.

This works fantastically, but unfortunately often poses a challenging question for teams or projects that have more than one author since they have to determine whether or not to track the configuration file(s) in version control. If they include the files in version control then they'll often run into conflicting opinions or even conflicting settings, such as those from extensions which are specific to the developer's local file system. However, if they exclude the files from version control then they give up the ability to share elements that are helpful for other developers and force contributors to manually duplicate part of their setup.

There are some longstanding requests from the VS Code community ([microsoft/vscode#40233][vscode-github-issue-40233], [microsoft/vscode#37519][vscode-github-issue-37519], [microsoft/vscode#15909][vscode-github-issue-15909]) to extend the product to address these concerns, and we hope to see a resolution natively within VS Code some day. This extension should help fill the gap in the interim however.

[vscode-settings-docs]: https://code.visualstudio.com/docs/getstarted/settings
[tasks-launch-docs]: https://code.visualstudio.com/docs/editor/workspaces#_workspace-tasks-and-launch-configurations
[vscode-github-issue-40233]: https://github.com/microsoft/vscode/issues/40233
[vscode-github-issue-37519]: https://github.com/microsoft/vscode/issues/37519
[vscode-github-issue-15909]: https://github.com/microsoft/vscode/issues/15909

## Feedback

Found a bug, have an idea for a new feature, or a question? Please reach out to us on the [project GitHub repository][github-repo-url] by opening an Issue or starting a Discussion! 

Like this extension? Please consider starring the repo on GitHub! ![][stars-badge].

You can also share feedback by rating the extension and/or leaving a [review][marketplace-reviews-url] on the Marketplace.

[stars-badge]: https://img.shields.io/github/stars/swellaby/vscode-workspace-config-plus?style=social
[marketplace-reviews-url]: https://marketplace.visualstudio.com/items?itemName=swellaby.workspace-config-plus&ssr=false#review-details

## Contributing

All contributions are welcomed and appreciated! See the [Contributing guide](./CONTRIBUTING.md) for more information.

## License

MIT - see license details [here][license-url]

## Code of Conduct

This project follows the standard [Code of Conduct](https://github.com/swellaby/.github/blob/master/CODE_OF_CONDUCT.md) as other Swellaby projects, which is the [Contributor Covenant](https://www.contributor-covenant.org/)

[installs-badge]: https://img.shields.io/vscode-marketplace/i/swellaby.vscode-workspace-config-plus?style=flat-square&label=installs
[version-badge]: https://img.shields.io/vscode-marketplace/v/swellaby.vscode-workspace-config-plus?style=flat-square&label=version
[rating-badge]: https://img.shields.io/vscode-marketplace/r/swellaby.vscode-workspace-config-plus?style=flat-square
[ext-url]: https://marketplace.visualstudio.com/items?itemName=swellaby.vscode-workspace-config-plus
[license-url]: https://github.com/swellaby/vscode-workspace-config-plus/blob/main/LICENSE
[license-badge]: https://img.shields.io/github/license/swellaby/vscode-workspace-config-plus?style=flat-square&color=blue
[linux-ci-badge]: https://img.shields.io/github/workflow/status/swellaby/vscode-workspace-config-plus/linux-ci/main?label=linux%20build&style=flat-square
[linux-ci-url]: https://github.com/swellaby/vscode-workspace-config-plus/actions/workflows/linux.yml?query=branch%3Amain
[mac-ci-badge]: https://img.shields.io/github/workflow/status/swellaby/vscode-workspace-config-plus/macos-ci/main?label=mac%20build&style=flat-square
[mac-ci-url]: https://github.com/swellaby/vscode-workspace-config-plus/actions/workflows/mac.yml?query=branch%3Amain
[windows-ci-badge]: https://img.shields.io/github/workflow/status/swellaby/vscode-workspace-config-plus/windows-ci/main?label=windows%20build&style=flat-square
[windows-ci-url]: https://github.com/swellaby/vscode-workspace-config-plus/actions/workflows/windows.yml?query=branch%3Amain
[coverage-badge]: https://img.shields.io/codecov/c/github/swellaby/vscode-workspace-config-plus/main?style=flat-square
[coverage-url]: https://codecov.io/gh/swellaby/vscode-workspace-config-plus
[tests-badge]: https://img.shields.io/sonar/tests/swellaby:vscode-workspace-config-plus?server=https%3A%2F%2Fsonarcloud.io&style=flat-square
[tests-url]: https://sonarcloud.io/component_measures?id=swellaby%3Avscode-workspace-config-plus&metric=test_success_density&selected=swellaby%3Avscode-workspace-config-plus%3Atests%2Funit%2Fwatcher.js&view=list
[quality-gate-badge]: https://img.shields.io/sonar/quality_gate/swellaby:vscode-workspace-config-plus?server=https%3A%2F%2Fsonarcloud.io&style=flat-square
[sonar-project-url]: https://sonarcloud.io/project/overview?id=swellaby%3Avscode-workspace-config-plus
[github-repo-url]: https://github.com/swellaby/vscode-workspace-config-plus
