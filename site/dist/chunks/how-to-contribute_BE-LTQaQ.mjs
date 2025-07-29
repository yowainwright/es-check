import { t as createVNode, F as Fragment, _ as __astro_tag_component__ } from './astro/server_B7dMEJ79.mjs';

const frontmatter = {
  "title": "How to contribute",
  "description": "Quasi sapiente voluptates aut minima non doloribus similique quisquam. In quo expedita ipsum nostrum corrupti incidunt. Et aut eligendi ea perferendis."
};
function getHeadings() {
  return [{
    "depth": 2,
    "slug": "getting-started",
    "text": "Getting Started"
  }];
}
function _createMdxContent(props) {
  const _components = {
    code: "code",
    h2: "h2",
    li: "li",
    ol: "ol",
    pre: "pre",
    span: "span",
    ...props.components
  };
  return createVNode(Fragment, {
    children: [createVNode(_components.h2, {
      id: "getting-started",
      children: "Getting Started"
    }), "\n", createVNode(_components.ol, {
      children: ["\n", createVNode(_components.li, {
        children: "Fork the repository on GitHub."
      }), "\n", createVNode(_components.li, {
        children: "Clone your forked repository to your local machine:"
      }), "\n"]
    }), "\n", createVNode("div", {
      class: "max-w-sm md:max-w-2xl",
      children: createVNode(_components.pre, {
        class: "astro-code github-dark",
        style: {
          backgroundColor: "#24292e",
          color: "#e1e4e8",
          overflowX: "auto"
        },
        tabindex: "0",
        "data-language": "bash",
        children: createVNode(_components.code, {
          children: createVNode(_components.span, {
            class: "line",
            children: [createVNode(_components.span, {
              style: {
                color: "#B392F0"
              },
              children: "git"
            }), createVNode(_components.span, {
              style: {
                color: "#9ECBFF"
              },
              children: " clone"
            }), createVNode(_components.span, {
              style: {
                color: "#9ECBFF"
              },
              children: " https://github.com/your-username/repository.git"
            })]
          })
        })
      })
    }), "\n", createVNode(_components.ol, {
      start: "3",
      children: ["\n", createVNode(_components.li, {
        children: "Set up the upstream remote:"
      }), "\n"]
    }), "\n", createVNode("div", {
      class: "max-w-sm md:max-w-2xl",
      children: createVNode(_components.pre, {
        class: "astro-code github-dark",
        style: {
          backgroundColor: "#24292e",
          color: "#e1e4e8",
          overflowX: "auto"
        },
        tabindex: "0",
        "data-language": "bash",
        children: createVNode(_components.code, {
          children: createVNode(_components.span, {
            class: "line",
            children: [createVNode(_components.span, {
              style: {
                color: "#B392F0"
              },
              children: "git"
            }), createVNode(_components.span, {
              style: {
                color: "#9ECBFF"
              },
              children: " remote"
            }), createVNode(_components.span, {
              style: {
                color: "#9ECBFF"
              },
              children: " add"
            }), createVNode(_components.span, {
              style: {
                color: "#9ECBFF"
              },
              children: " upstream"
            }), createVNode(_components.span, {
              style: {
                color: "#9ECBFF"
              },
              children: " https://github.com/original-repository/repository.git"
            })]
          })
        })
      })
    }), "\n", createVNode(_components.ol, {
      start: "4",
      children: ["\n", createVNode(_components.li, {
        children: "Create a new branch for your contribution:"
      }), "\n"]
    }), "\n", createVNode("div", {
      class: "max-w-sm md:max-w-2xl",
      children: createVNode(_components.pre, {
        class: "astro-code github-dark",
        style: {
          backgroundColor: "#24292e",
          color: "#e1e4e8",
          overflowX: "auto"
        },
        tabindex: "0",
        "data-language": "bash",
        children: createVNode(_components.code, {
          children: createVNode(_components.span, {
            class: "line",
            children: [createVNode(_components.span, {
              style: {
                color: "#B392F0"
              },
              children: "git"
            }), createVNode(_components.span, {
              style: {
                color: "#9ECBFF"
              },
              children: " checkout"
            }), createVNode(_components.span, {
              style: {
                color: "#79B8FF"
              },
              children: " -b"
            }), createVNode(_components.span, {
              style: {
                color: "#9ECBFF"
              },
              children: " feature/new-feature"
            })]
          })
        })
      })
    })]
  });
}
function MDXContent(props = {}) {
  const {wrapper: MDXLayout} = props.components || ({});
  return MDXLayout ? createVNode(MDXLayout, {
    ...props,
    children: createVNode(_createMdxContent, {
      ...props
    })
  }) : _createMdxContent(props);
}

const url = "src/content/docs/how-to-contribute.mdx";
const file = "/Users/jeffrywainwright/code/oss/es-check/site/src/content/docs/how-to-contribute.mdx";
const Content = (props = {}) => MDXContent({
  ...props,
  components: { Fragment: Fragment, ...props.components, },
});
Content[Symbol.for('mdx-component')] = true;
Content[Symbol.for('astro.needsHeadRendering')] = !Boolean(frontmatter.layout);
Content.moduleId = "/Users/jeffrywainwright/code/oss/es-check/site/src/content/docs/how-to-contribute.mdx";
__astro_tag_component__(Content, 'astro:jsx');

export { Content, Content as default, file, frontmatter, getHeadings, url };
