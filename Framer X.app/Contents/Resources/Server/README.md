# Framer CLI

The Framer CLI allows for the building and publishing your [Framer folder projects](https://framer.gitbook.io/teams/integrations#folder-projects) via the command line.

<details>
<summary>🗃 Table of Contents</summary>

-   [Installation](#-installation)
    -   [Dependency Free](#-dependency-free)
    -   [Global](#-global)
    -   [Local](#-local)
-   [Commands](#-commands)
    -   [`authenticate`](#-authenticate)
    -   [`build`](#-build)
    -   [`publish`](#-publish)
        -   [Options](#-options)
        -   [Versioning](#-versioning)
        -   [Metadata](#-metadata)
    -   [`version`](#-version)
    -   [`help`](#-help)
-   [Integration](#-integration)
    -   [Continuous Integration](#-continuous-integration)
    -   [GitHub Actions](#-github-actions)

</details>

## 👩‍💻 Installation

### ✨ Dependency Free

In nearly all cases, it is advisable to use [`npx`](https://www.npmjs.com/package/npx) (which shipped with npm@5.2.0) to execute `framer-cli` commands, preventing the need to add the package as a dependency:

```sh
npx framer-cli help
```

### 🌍 Global

If publishing packages from a local machine and `npx` is not a viable option, it is best to globally install the `framer-cli` package:

```sh
yarn global add framer-cli
# or
npm install -g framer-cli
```

The global installation will make the `framer` command directly available via the command line:

```sh
framer help
```

### 🖥 Local

In _very_ rare cases, it might be necessary to install the `framer-cli` as a `devDependency` of a JavaScript project. The `framer-cli` package can be installed like any other dependency:

```sh
yarn add -D framer-cli
# or
npm install --save-dev framer-cli
```

This will make a `framer` command available to be run by inside the directory with either `yarn`, `npx`, or by directly calling the `bin` file:

```sh
yarn framer
# or
npx framer
# or
./node_modules/.bin/framer
```

## 🕹 Commands

The Framer CLI exposes four commands:

-   [🔑 `authenticate`](#-authenticate)
-   [📦 `build`](#-build)
-   [🚀 `publish`](#-publish)
-   [🗂 `version`](#-version)
-   [📖 `help`](#-help)

### 🔑 `authenticate`

```sh
npx framer-cli authenticate <email@address>
```

In order to publish a package, the CLI must be able to verify the identity of the user using a special token. This is done through an authentication flow where by an email is sent to the registered user with a link, which when clicked, creates a special `FRAMER_TOKEN` that is printed in the terminal. This token is used as an [environment variable](https://en.wikipedia.org/wiki/Environment_variable) for publishing packages to both public or private stores under the authenticated user's name.

### 📦 `build`

```sh
npx framer-cli build [path/to/project.framerfx]
```

The `build` command ensures that the project is in a valid state for publishing.

If the command is being run inside the Framer project, there is no need to specify the path to the project. However, if the command is being run from outside the project, the project path must be provided as a second argument.

### 🚀 `publish`

```sh
env FRAMER_TOKEN=<token> npx framer-cli publish [path/to/project.framerfx] [--yes] [--major] [--public] [--new=<name>]
```

The `publish` command is responsible for:

1. Building the project
1. Managing project versioning (defaults to minor version)
1. Publishing the project to the store

The `publish` command requires a `FRAMER_TOKEN` environment variable for publishing. This token is unique to a given individual and is used for both authentication and determining the user's available private store, if any.

If the command is being run inside the Framer project, there is no need to specify the path to the project. However, if the command is being run from outside the project, the project path must be provided as a second argument.

#### 📑 Options

The `publish` command also exposes a series of command line options:

| **Option** | **Description**                                                                                                                                        | **Default**   |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------- |
| `yes`      | Automatically confirm all prompts. This is especially useful when publishing from a CI.                                                                | **false**     |
| `major`    | Override the default versioning strategy (`minor` bump) to instead use a `major` version bump.                                                         | **false**     |
| `public`   | Publish the package to the public Framer store. This flag must be set if the user does not have access to a private store.                             | **false**     |
| `new`      | Provide a name for the package when being published for the first time. If the package has previously been published, this argument **cannot** be set. | **undefined** |

Available options can also be seen in the terminal by running:

```sh
npx framer-cli help
```

#### 🗂 Versioning

By default, `framer-cli` will look at the Framer repository to find the last published version and then publish the Framer package with the next version, either a minor or major bump depending on the CLI arguments.

However, it is possible to override this behavior by manually updating `package.json` version property. If the new version is higher than the last published version, it will be used without any change.

#### 🖇 Metadata

Artwork for Framer packages is supported through specially named images in the `metadata` directory:

-   `icon.png` at 100x100
-   `artwork.png` at 1600x1200

Similarly, descriptions for Framer packages come from their `README.md` file, with full [Markdown](https://guides.github.com/features/mastering-markdown) syntax support.

### 🗂 `version`

```sh
npx framer-cli version [path/to/project.framerfx]
```

The `version` command provides the latest version of the package in the store.

If the command is being run inside the Framer project, there is no need to specify the path to the project. However, if the command is being run from outside the project, the project path must be provided as a second argument.

### 📖 `help`

```sh
npx framer-cli help
```

The `help` command provides a general overview of each of the commands, their purpose, and their options. It is also possible to get help by running any of the above commands with the `-h` or `--help` flag.

## 🔮 Integration

### 🚚 Continuous Integration

One of the key aspects of `framer-cli` is the enablement of automated Framer package publishing. By combining the script with a CI workflow, it becomes possible to always keep the Framer package in the store in sync with the Framer package in the repository.

As an example of integrating `framer-cli` with an external CI service, here is a small [CircleCI configuration](https://circleci.com/docs/2.0/configuration-reference) that publishes a Framer package every time a commit is made to the `master` branch.

_Please note that this example assumes that the `FRAMER_TOKEN` environment variable has already been set in the [CI project settings](https://circleci.com/docs/2.0/env-vars/#setting-an-environment-variable-in-a-project)._

<!-- prettier-ignore -->
```yml
# Javascript Node CircleCI 2.0 configuration file
#
# Check https://circleci.com/docs/2.0/language-javascript/ for more details
#
version: 2
jobs:
  publish:
    docker:
      - image: circleci/node:10

    working_directory: ~/repo

    steps:
      - checkout
      - run: yarn
      - run: npx framer-cli publish --yes

workflows:
  version: 2
  publish:
    jobs:
      - publish:
          filters:
            branches:
              only: master
```

### 🤖 GitHub Actions

It is also possible to use [GitHub Actions](https://github.com/features/actions) to automate the release of a Framer package without the use of a separate CI. The Framer Bridge action can be added directly from the [marketplace](https://github.com/marketplace/actions/framer-bridge-action) and an example of a build and publish workflow, ready to be cloned, can be found [here](https://github.com/framer/framer-bridge-starter-kit/blob/master/.github/main.workflow).
