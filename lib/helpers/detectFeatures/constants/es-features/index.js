const { ES6_FEATURES } = require("./6");
const { ES7_FEATURES } = require("./7");
const { ES8_FEATURES } = require("./8");
const { ES9_FEATURES } = require("./9");
const { ES10_FEATURES } = require("./10");
const { ES11_FEATURES } = require("./11");
const { ES12_FEATURES } = require("./12");
const { ES13_FEATURES } = require("./13");
const { ES14_FEATURES } = require("./14");
const { ES15_FEATURES } = require("./15");
const { ES16_FEATURES } = require("./16");

const ES_FEATURES = {
  ...ES6_FEATURES,
  ...ES7_FEATURES,
  ...ES8_FEATURES,
  ...ES9_FEATURES,
  ...ES10_FEATURES,
  ...ES11_FEATURES,
  ...ES12_FEATURES,
  ...ES13_FEATURES,
  ...ES14_FEATURES,
  ...ES15_FEATURES,
  ...ES16_FEATURES,
};

module.exports = { ES_FEATURES };
