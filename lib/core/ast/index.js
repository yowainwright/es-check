const { checkMap, getStaticPropertyName } = require("./utils");
const detector = require("./detector");

module.exports = Object.assign({ checkMap, getStaticPropertyName }, detector);
