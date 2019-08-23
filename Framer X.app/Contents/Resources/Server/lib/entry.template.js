// The template for the dynamic webpack entry. Be aware of the variables

const packageJson = require("./package.json")

const package = {
    packageJson,
    sourceModules: {},
    dependencies: {},
}

// This is a special webpack thing that watches the whole directory
// https://github.com/webpack/docs/wiki/context
const ctx = require.context("./code", true, /\.(t|j)s(x?)|\.css$/)

ctx.keys().forEach(key => {
    package.sourceModules[key] = () => ctx(key)
})

// The packages are passed in through a template
PACKAGES_CODE

package.dependencies = packages

exports.__framer__ = package
