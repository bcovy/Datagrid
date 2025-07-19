import terser from "@rollup/plugin-terser";
import postcss from "rollup-plugin-postcss";

const fs  = require("fs-extra");

class Builder {
    constructor(env) {
        this.bundles = [];
        this.env = env;
    }

    bundle() {
        console.log("Building dev package bundles: ", this.env);

        switch(this.env) {
            case "js":
                this.bundleScripts();
                break;
            case "esm":
                this.bundleEms();
                break;
            case "cssmin":
                this.bundleCssMin();
                break;
            case "scss":
                this.bundleCss();
                break;
            default:
                console.error("Select a valid item.");
                break;
        }
        
        return this.bundles;
    }

    bundleScripts() {
        this.bundles.push({
            input: "src/builds/full.js",
            output: [{
                file: "dist/datagrid.js",
                format: "esm",
                generatedCode: { constBindings: true },
                sourcemap: "inline"
            }, {
                file: "dev/web/scripts/datagrid.js",
                format: "esm",
                generatedCode: { constBindings: true },
                sourcemap: "inline"
            }, {
                file: "dist/datagrid.min.js",
                format: "esm",
                generatedCode: { constBindings: true },
                plugins: [ terser({ module: false, toplevel: false })]
                }],
            treeshake: false
        });
    }

    bundleEms() {
        this.bundles.push({
            input: "src/builds/ems.js",
            output: {
                file: "dist/datagrid_ems.js",
                format: "esm",
                exports: "named",
                sourcemap: "inline",
                generatedCode: { constBindings: true }
            },
            treeshake: false
        });
    }

    bundleCss() {
        fs.removeSync("./dist/datagrid.css");

        this.bundles.push({
            input: "src/css/appstyles.scss", 
            output: [
                { file: "dist/datagrid.css", format: "es" }, 
                { file: "dev/web/css/datagrid.css", format: "es" }
            ],
            plugins: [
                postcss({ 
                    modules: false,
                    extract: true,
                    minimize: false,
                    sourceMap: false
                })
            ]
        });
    }

    bundleCssMin() {
        fs.removeSync("./dist/datagrid.min.css");

        this.bundles.push({
            input: "src/css/appstyles.scss", 
            output: { 
                file: "dist/datagrid.min.css",
                format: "es"
            },
            plugins: [
                postcss({ 
                    modules: false,
                    extract: true,
                    minimize: true,
                    sourceMap: false
                })
            ]
        });
    }
}

export { Builder };