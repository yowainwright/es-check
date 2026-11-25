const version = import.meta.env.ES_CHECK_VERSION;
const edition = import.meta.env.ES_CHECK_EDITION;

export const BADGE_TEXT = `v${version} with initial ${edition} support`;
export const BADGE_HREF = "https://github.com/yowainwright/es-check/releases";

export const RAINBOW_GRADIENT =
  "linear-gradient(90deg, #ff6b6b, #feca57, #48dbfb, #ff9ff3, #54a0ff, #5f27cd, #ff6b6b)";

export const RAINBOW_ANIMATION = {
  backgroundSize: "200% auto",
  animation: "rainbow 3s linear infinite",
};

export const RAINBOW_KEYFRAMES = `
@keyframes rainbow {
  0% { background-position: 0% center; }
  100% { background-position: 200% center; }
}
`;
