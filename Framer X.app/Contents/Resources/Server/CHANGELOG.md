# v1.5.2

### Fixes

-   Change private dependencies to load on demand.

# v1.5.1

### Fixes

-   Handle private dependencies not being accessible.

# v1.4.0

## Features

-   Add new `version` command to show the latest published version of package in the store.

## Improvements

-   Update messaging to be more consistent and actionable.
-   Update keywords and description to make it easier to find this package.
-   Update build command to include `CHANGLOG` when publishing.

# v1.3.3

## Fixes

-   Check the package is successfully processed before considering publication successful.

# v1.3.2

## Fixes

-   Handle `yarn` warnings when publishing.
-   Support package names where the scope is different than the store.

## Improvements

-   Reset package version to 1.0.0 when publishing to a different store for the first time.

# v1.3.1

## Fixes

-   External dependencies bundled into package are properly detected with resolution instructions.
-   Logic for determining package name and status fixed for previously published packages.

## Improvements

-   Making error messages are more actionable.
-   README `circleci` example configuration updated.
