import { Builder } from "./builder.js";

const builder = new Builder(process.env.TARGET);

module.exports = builder.bundle();