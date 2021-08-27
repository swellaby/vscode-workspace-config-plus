# VS Code Workspace Config+

Provides additional capabilities to manage your workspace configuration, including the ability to utilize `shared` and `local` versions of the VS Code workspace configuration files.

***************************************
**Functional, but still in a Beta !!!!**  
***************************************

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

* Adds support for `shared` and `local` configuration files (`.vscode/*.shared.json`, and `.vscode/*.local.json`)

### Shared and Local Configuration Files

With this extension you can now differentiate between shared configurations that can be checked into version control and shared with other team members, as well as local configuration not in version control which can extend (or override) the shared configuration.

It currently supports:

* `settings.json` - (`settings.shared.json`, `settings.local.json`)
* `tasks.json` - (`tasks.shared.json`, `tasks.local.json`)
* `launch.json` - (`launch.shared.json`, `launch.local.json`)

Be sure your `*.local.json` files and the main VS Code files are exclude from version control by adding the corresponding entries to your projects ignore file (e.g. `.gitignore`, `.hgignore`). For example:

```
# .gitignore
.vscode/settings.json
.vscode/settings.local.json
```

#### Background

VS Code is highly configurable, and allows you to [configure specific workspaces in addition to your global user settings.]([vscode-settings-docs]). This includes things like general settings, such as the zoom level, as well as [tasks and launch configurations] amongst others. These configurations are stored in various respective files within the `.vscode` directory in the workspace. For example, the workspace task configuration is stored in `.vscode/tasks.json`.

This works fantastically, but unfortunately often poses a challenging question for teams or projects that have more than one author since they have to determine whether or not to track the configuration file(s) in version control. If they include the files in version control then they'll often run into conflicting opinions or even conflicting settings, such as those from extensions which are specific to the developers local file system. However, if they exclude the files from version control then they give up the ability to share elements that are helpful for other developers and force contributors to manually duplicate part of their setup.

There are some longstanding requests from the VS Code community ([microsoft/vscode#40233][vscode-github-issue-40233], [microsoft/vscode#37519][vscode-github-issue-37519], [microsoft/vscode#15909][vscode-github-issue-15909]) to extend the product to address these concerns, and we hope to see a resolution natively within VS Code one day. This extension should help fill the gap in the interim however.

[vscode-settings-docs]: https://code.visualstudio.com/docs/getstarted/settings
[tasks-launch-docs]: https://code.visualstudio.com/docs/editor/workspaces#_workspace-tasks-and-launch-configurations
[vscode-github-issue-40233]: https://github.com/microsoft/vscode/issues/40233
[vscode-github-issue-37519]: https://github.com/microsoft/vscode/issues/37519
[vscode-github-issue-15909]: https://github.com/microsoft/vscode/issues/15909

## Contributing

## License

## Code of Conduct

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

