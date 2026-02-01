const versions = require("./versions");
const esFeatures = require("./es-features");
const typescript = require("./typescript");

module.exports = Object.assign({}, versions, esFeatures, typescript);
