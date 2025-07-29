import { c as createComponent, j as createAstro, m as maybeRenderHead, r as renderComponent, b as addAttribute, a as renderTemplate, k as renderHead, l as renderSlot } from './astro/server_B7dMEJ79.mjs';
/* empty css                             */
import { $ as $$ThemeToggle } from './ThemeToggle_DVHodLIO.mjs';

const contributors = [
  {
    name: "yowainwright",
    profile: "https://avatars.githubusercontent.com/u/1074042?v=4",
    contributions: 475
    // Combined from both repos
  },
  {
    name: "briangonzalez",
    profile: "https://avatars.githubusercontent.com/u/659829?v=4",
    contributions: 14
    // Combined from both repos
  },
  {
    name: "brandonocasey",
    profile: "https://avatars.githubusercontent.com/u/2381475?v=4",
    contributions: 10
    // Combined from both repos
  },
  {
    name: "merrywhether",
    profile: "https://avatars.githubusercontent.com/u/4097742?v=4",
    contributions: 5
  },
  {
    name: "sudo-suhas",
    profile: "https://avatars.githubusercontent.com/u/22251956?v=4",
    contributions: 6
    // Combined from both repos
  },
  {
    name: "jakiestfu",
    profile: "https://avatars.githubusercontent.com/u/1041792?v=4",
    contributions: 4
    // Combined from both repos
  },
  {
    name: "someguynamedmatt",
    profile: "https://avatars.githubusercontent.com/u/17413539?v=4",
    contributions: 4
    // Combined from both repos
  },
  {
    name: "mitzafon-wix",
    profile: "https://avatars.githubusercontent.com/u/47983321?v=4",
    contributions: 3
  },
  {
    name: "andersk",
    profile: "https://avatars.githubusercontent.com/u/26471?v=4",
    contributions: 2
  },
  {
    name: "noah-potter",
    profile: "https://avatars.githubusercontent.com/u/17100846?v=4",
    contributions: 2
  },
  {
    name: "StudioMaX",
    profile: "https://avatars.githubusercontent.com/u/9878458?v=4",
    contributions: 2
  },
  {
    name: "MrBenJ",
    profile: "https://avatars.githubusercontent.com/u/7918387?v=4",
    contributions: 2
    // Combined from both repos
  },
  {
    name: "shellbj",
    profile: "https://avatars.githubusercontent.com/u/397853?v=4",
    contributions: 2
    // Combined from both repos
  },
  {
    name: "jeffbski",
    profile: "https://avatars.githubusercontent.com/u/5689?v=4",
    contributions: 1
  },
  {
    name: "jonahsnider",
    profile: "https://avatars.githubusercontent.com/u/7608555?v=4",
    contributions: 1
  },
  {
    name: "jrbalsano",
    profile: "https://avatars.githubusercontent.com/u/1245639?v=4",
    contributions: 1
  },
  {
    name: "nicholashza",
    profile: "https://avatars.githubusercontent.com/u/16383760?v=4",
    contributions: 1
  },
  {
    name: "jonathanong",
    profile: "https://avatars.githubusercontent.com/u/216170?v=4",
    contributions: 1
  },
  {
    name: "PawelGrzybek",
    profile: "https://avatars.githubusercontent.com/u/7265023?v=4",
    contributions: 1
  },
  {
    name: "reznord",
    profile: "https://avatars.githubusercontent.com/u/3415488?v=4",
    contributions: 1
  }
];

const $$Astro$1 = createAstro();
const $$Header = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$1, $$props, $$slots);
  Astro2.self = $$Header;
  const navigation = [
    {
      title: "Home",
      href: "/"
    },
    {
      title: "Docs",
      href: "/documentation/gettingstarted"
    },
    {
      title: "Community",
      href: "/community"
    }
  ];
  const pathname = new URL(Astro2.request.url).pathname;
  return renderTemplate`${maybeRenderHead()}<header class="sticky top-0 z-30"> <nav class="navbar bg-base-100/80 border-b border-base-content/10 backdrop-blur-3xl justify-center items-center py-2 sm:px-0 md:px-20 font-outfit"> <div class="dropdown"> <div tabindex="0" role="button" class="btn btn-ghost btn-square lg:hidden"> <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h8m-8 6h16"></path></svg> </div> <ul tabindex="0" class="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-52"> ${navigation.map((item) => renderTemplate`<li> <a${addAttribute(`hover:text-primary hover:bg-primary/5 transition flex ${pathname === item.href ? "text-primary bg-primary/5" : ""}`, "class")}${addAttribute(item.href, "href")}> ${item.title} </a> </li>`)} </ul> </div> <div class="navbar-start"> <a href="/" class="btn btn-ghost px-2 flex items-center gap-2"> <img src="/es-check-logo.svg" alt="ES Check" class="h-8 w-8"> <h1 class="text-xl md:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/50">
ES Check
</h1> </a> </div> <div class="navbar-center hidden lg:flex"> <ul class="menu menu-horizontal text-base font-medium"> ${navigation.map((item) => renderTemplate`<li> <a${addAttribute(`hover:text-primary hover:bg-primary/5 transition flex ${pathname === item.href ? "text-primary bg-primary/5" : ""}`, "class")}${addAttribute(item.href, "href")}> ${item.title} </a> </li>`)} </ul> </div> <div class="navbar-end"> <a class="btn btn-sm btn-ghost btn-square" href="https://twitter.com/yowainwright" aria-label="twitter"> <svg viewBox="0 0 24 24" aria-hidden="true" class="h-4 w-4"><path d="M13.3174 10.7749L19.1457 4H17.7646L12.7039 9.88256L8.66193 4H4L10.1122 12.8955L4 20H5.38119L10.7254 13.7878L14.994 20H19.656L13.3171 10.7749H13.3174ZM11.4257 12.9738L10.8064 12.0881L5.87886 5.03974H8.00029L11.9769 10.728L12.5962 11.6137L17.7652 19.0075H15.6438L11.4257 12.9742V12.9738Z" fill="currentColor"></path></svg> </a> <a class="btn btn-sm btn-ghost btn-square" href="https://github.com/yowainwright/es-check" aria-label="github"> <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" class="h-4 w-4"><path d="M7.999 0C3.582 0 0 3.596 0 8.032a8.031 8.031 0 0 0 5.472 7.621c.4.074.546-.174.546-.387 0-.191-.007-.696-.011-1.366-2.225.485-2.695-1.077-2.695-1.077-.363-.928-.888-1.175-.888-1.175-.727-.498.054-.488.054-.488.803.057 1.225.828 1.225.828.714 1.227 1.873.873 2.329.667.072-.519.279-.873.508-1.074-1.776-.203-3.644-.892-3.644-3.969 0-.877.312-1.594.824-2.156-.083-.203-.357-1.02.078-2.125 0 0 .672-.216 2.2.823a7.633 7.633 0 0 1 2.003-.27 7.65 7.65 0 0 1 2.003.271c1.527-1.039 2.198-.823 2.198-.823.436 1.106.162 1.922.08 2.125.513.562.822 1.279.822 2.156 0 3.085-1.87 3.764-3.652 3.963.287.248.543.738.543 1.487 0 1.074-.01 1.94-.01 2.203 0 .215.144.465.55.386A8.032 8.032 0 0 0 16 8.032C16 3.596 12.418 0 7.999 0z" fill="currentColor"></path> </svg> </a> ${renderComponent($$result, "ThemeToggle", $$ThemeToggle, {})} </div> </nav> </header>`;
}, "/Users/jeffrywainwright/code/oss/es-check/site/src/components/home/Header.astro", void 0);

const $$Footer = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${maybeRenderHead()}<footer class="footer px-4 md:px-10 xl:px-28 py-7 border-t border-base-300 flex flex-col lg:flex-row justify-between items-center font-outfit"> <p>ES Check © ${(/* @__PURE__ */ new Date()).getFullYear()} - MIT License</p> <div class="lg:w-56 flex items-center"> <a href="https://github.com/yowainwright/es-check" class="link link-hover">
View on GitHub
</a> </div> <nav class="md:place-self-center md:justify-self-end"> <div class="grid grid-flow-col gap-4"> <a class="btn btn-sm btn-ghost btn-circle" href="https://github.com/yowainwright/es-check" aria-label="github"> <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" class="h-4 w-4"><path d="M7.999 0C3.582 0 0 3.596 0 8.032a8.031 8.031 0 0 0 5.472 7.621c.4.074.546-.174.546-.387 0-.191-.007-.696-.011-1.366-2.225.485-2.695-1.077-2.695-1.077-.363-.928-.888-1.175-.888-1.175-.727-.498.054-.488.054-.488.803.057 1.225.828 1.225.828.714 1.227 1.873.873 2.329.667.072-.519.279-.873.508-1.074-1.776-.203-3.644-.892-3.644-3.969 0-.877.312-1.594.824-2.156-.083-.203-.357-1.02.078-2.125 0 0 .672-.216 2.2.823a7.633 7.633 0 0 1 2.003-.27 7.65 7.65 0 0 1 2.003.271c1.527-1.039 2.198-.823 2.198-.823.436 1.106.162 1.922.08 2.125.513.562.822 1.279.822 2.156 0 3.085-1.87 3.764-3.652 3.963.287.248.543.738.543 1.487 0 1.074-.01 1.94-.01 2.203 0 .215.144.465.55.386A8.032 8.032 0 0 0 16 8.032C16 3.596 12.418 0 7.999 0z" fill="currentColor"></path> </svg> </a> </div> </nav> </footer>`;
}, "/Users/jeffrywainwright/code/oss/es-check/site/src/components/common/Footer.astro", void 0);

const $$Astro = createAstro();
const $$HomeLayout = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$HomeLayout;
  const { title } = Astro2.props;
  return renderTemplate`<html lang="en"> <head><meta charset="UTF-8"><meta name="description" content="ES Check - Check JavaScript files ES version against a specified ES version"><meta name="viewport" content="width=device-width"><link rel="icon" type="image/svg+xml" href="/es-check-logo.svg"><meta name="generator"${addAttribute(Astro2.generator, "content")}><title>${title} - ES Check</title>${renderHead()}</head> <body> <div> ${renderComponent($$result, "Header", $$Header, {})} ${renderSlot($$result, $$slots["default"])} ${renderComponent($$result, "Footer", $$Footer, {})} </div> </body></html>`;
}, "/Users/jeffrywainwright/code/oss/es-check/site/src/layouts/HomeLayout.astro", void 0);

export { $$HomeLayout as $, contributors as c };
