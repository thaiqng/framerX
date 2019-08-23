"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const minimist = require("minimist");
const readline = require("readline");
const chalk_1 = require("chalk");
const ora_1 = require("ora");
exports.setProcessTitle = (title) => {
    process.title = title;
};
// one spinner for the command (this might change in the future)
exports.spinner = ora_1.default();
const usage = {
    authenticate: chalk_1.default `    🔑 {bold authenticate} <email>
        Generate a new authentication token.

        Once you have the token, set it as a {bold {underline FRAMER_TOKEN} }
        environmental variable to run other commands, e.g.
        "{bold env FRAMER_TOKEN=<token> npx framer-cli publish 
        [project.framerfx]}".`,
    build: chalk_1.default `    📦 {bold build} [project.framerfx]
        Ensure the Framer project is in a valid state for
        publishing.`,
    publish: chalk_1.default `    🚀 {bold publish} [project.framerfx] [--major] [--public] [--new=<name>]
        Publish the Framer project to the store.

        The {bold {underline FRAMER_TOKEN}} environment variable must be set.

        If you belong to an organization, the package will be
        published to the private store unless specified otherwise
        with the {bold --public} flag.

        The package version will be bumped automatically, as a
        minor version change. Use the {bold --major} flag for major
        version bump.

        New packages must be published with the {bold --new} argument
        and the desired {bold display name} of the package. 
        
        Store artwork for the package is supported by adding 
        {bold artwork.png} (1600x1200) and {bold icon.png} (100x100) files to 
        the {underline /metadata} directory. The package description can be
        updated by modifying the {bold README.md} file.`,
    version: chalk_1.default `    🗂  {bold version} [project.framerfx]
        Get the latest published version of the package.`,
    help: chalk_1.default `    📖 {bold help}
        Print usage.`,
};
const options = {
    yes: chalk_1.default `    {bold --yes}            Automatically confirm all prompts.`,
    help: chalk_1.default `    {bold --help}           View information about any command.`,
};
exports.printUsage = (command = "") => {
    exports.spinner.stop();
    const output = [chalk_1.default `\n{greenBright Usage:}`];
    if (usage[command] && command !== "help") {
        output.push(usage[command], usage.help);
    }
    else {
        output.push(...Object.values(usage));
    }
    output.push(chalk_1.default `{greenBright Global options:}`, Object.values(options).join("\n"));
    console.log(output.join("\n\n"), "\n");
};
exports.print = (message) => {
    const isSpinning = exports.spinner.isSpinning;
    if (isSpinning)
        exports.spinner.stop();
    console.log(message);
    if (isSpinning)
        exports.spinner.start();
};
exports.printWarning = (message) => {
    exports.print(`🚨 ${message}`);
};
exports.printError = (message) => {
    const { command } = exports.parseArgv();
    exports.spinner.stop();
    console.log();
    exports.spinner.stopAndPersist({
        text: chalk_1.default `{redBright ${message}}`,
        symbol: "❌",
    });
    exports.printUsage(command);
};
exports.printMissingDependenciesWarning = (dependencies, projectPath) => {
    const fileName = path.basename(projectPath);
    exports.printWarning(chalk_1.default `Some dependencies are bundled with the package.

This happens when your dependencies are not explicitly
declared in the Framer project's {underline package.json} file.

Run the following inside {underline ${fileName}} to fix this:

{bold yarn add \
  ${dependencies.join(" \\\n  ")}}
`);
};
exports.parseArgv = () => {
    const argv = minimist(process.argv.slice(2));
    const command = argv._[0];
    const help = !!(argv.h || argv.help);
    return { command, argv, help };
};
exports.prompt = (question) => {
    const rl = readline.createInterface(process.stdin, process.stdout);
    return new Promise(resolve => {
        rl.question(question, resolve);
    });
};
