import { t as createVNode, F as Fragment, _ as __astro_tag_component__ } from './astro/server_B7dMEJ79.mjs';

const frontmatter = {
  "title": "Installation",
  "description": "How to install ES Check in your project"
};
function getHeadings() {
  return [{
    "depth": 1,
    "slug": "installation",
    "text": "Installation"
  }, {
    "depth": 2,
    "slug": "prerequisites",
    "text": "Prerequisites"
  }, {
    "depth": 2,
    "slug": "installation-methods",
    "text": "Installation Methods"
  }, {
    "depth": 3,
    "slug": "local-installation-recommended",
    "text": "Local Installation (Recommended)"
  }, {
    "depth": 3,
    "slug": "global-installation",
    "text": "Global Installation"
  }, {
    "depth": 2,
    "slug": "verify-installation",
    "text": "Verify Installation"
  }, {
    "depth": 2,
    "slug": "setting-up-in-packagejson",
    "text": "Setting Up in package.json"
  }, {
    "depth": 2,
    "slug": "next-steps",
    "text": "Next Steps"
  }];
}
function _createMdxContent(props) {
  const _components = {
    a: "a",
    code: "code",
    h1: "h1",
    h2: "h2",
    h3: "h3",
    li: "li",
    p: "p",
    pre: "pre",
    span: "span",
    ul: "ul",
    ...props.components
  };
  return createVNode(Fragment, {
    children: [createVNode(_components.h1, {
      id: "installation",
      children: "Installation"
    }), "\n", createVNode(_components.p, {
      children: "ES Check can be installed globally for system-wide usage or locally within your project."
    }), "\n", createVNode(_components.h2, {
      id: "prerequisites",
      children: "Prerequisites"
    }), "\n", createVNode(_components.ul, {
      children: ["\n", createVNode(_components.li, {
        children: "Node.js (version 14 or higher)"
      }), "\n", createVNode(_components.li, {
        children: "npm or yarn package manager"
      }), "\n"]
    }), "\n", createVNode(_components.h2, {
      id: "installation-methods",
      children: "Installation Methods"
    }), "\n", createVNode(_components.h3, {
      id: "local-installation-recommended",
      children: "Local Installation (Recommended)"
    }), "\n", createVNode(_components.p, {
      children: "Installing ES Check locally ensures that everyone working on your project uses the same version:"
    }), "\n", createVNode(_components.pre, {
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
            children: "npm"
          }), createVNode(_components.span, {
            style: {
              color: "#9ECBFF"
            },
            children: " install"
          }), createVNode(_components.span, {
            style: {
              color: "#9ECBFF"
            },
            children: " es-check"
          }), createVNode(_components.span, {
            style: {
              color: "#79B8FF"
            },
            children: " --save-dev"
          })]
        })
      })
    }), "\n", createVNode(_components.p, {
      children: "Or with yarn:"
    }), "\n", createVNode(_components.pre, {
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
            children: "yarn"
          }), createVNode(_components.span, {
            style: {
              color: "#9ECBFF"
            },
            children: " add"
          }), createVNode(_components.span, {
            style: {
              color: "#9ECBFF"
            },
            children: " es-check"
          }), createVNode(_components.span, {
            style: {
              color: "#79B8FF"
            },
            children: " --dev"
          })]
        })
      })
    }), "\n", createVNode(_components.h3, {
      id: "global-installation",
      children: "Global Installation"
    }), "\n", createVNode(_components.p, {
      children: "For system-wide availability:"
    }), "\n", createVNode(_components.pre, {
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
            children: "npm"
          }), createVNode(_components.span, {
            style: {
              color: "#9ECBFF"
            },
            children: " install"
          }), createVNode(_components.span, {
            style: {
              color: "#79B8FF"
            },
            children: " -g"
          }), createVNode(_components.span, {
            style: {
              color: "#9ECBFF"
            },
            children: " es-check"
          })]
        })
      })
    }), "\n", createVNode(_components.p, {
      children: "Or with yarn:"
    }), "\n", createVNode(_components.pre, {
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
            children: "yarn"
          }), createVNode(_components.span, {
            style: {
              color: "#9ECBFF"
            },
            children: " global"
          }), createVNode(_components.span, {
            style: {
              color: "#9ECBFF"
            },
            children: " add"
          }), createVNode(_components.span, {
            style: {
              color: "#9ECBFF"
            },
            children: " es-check"
          })]
        })
      })
    }), "\n", createVNode(_components.h2, {
      id: "verify-installation",
      children: "Verify Installation"
    }), "\n", createVNode(_components.p, {
      children: "To verify ES Check is installed correctly:"
    }), "\n", createVNode(_components.pre, {
      class: "astro-code github-dark",
      style: {
        backgroundColor: "#24292e",
        color: "#e1e4e8",
        overflowX: "auto"
      },
      tabindex: "0",
      "data-language": "bash",
      children: createVNode(_components.code, {
        children: [createVNode(_components.span, {
          class: "line",
          children: createVNode(_components.span, {
            style: {
              color: "#6A737D"
            },
            children: "# For local installation"
          })
        }), "\n", createVNode(_components.span, {
          class: "line",
          children: [createVNode(_components.span, {
            style: {
              color: "#B392F0"
            },
            children: "npx"
          }), createVNode(_components.span, {
            style: {
              color: "#9ECBFF"
            },
            children: " es-check"
          }), createVNode(_components.span, {
            style: {
              color: "#79B8FF"
            },
            children: " --version"
          })]
        }), "\n", createVNode(_components.span, {
          class: "line"
        }), "\n", createVNode(_components.span, {
          class: "line",
          children: createVNode(_components.span, {
            style: {
              color: "#6A737D"
            },
            children: "# For global installation"
          })
        }), "\n", createVNode(_components.span, {
          class: "line",
          children: [createVNode(_components.span, {
            style: {
              color: "#B392F0"
            },
            children: "es-check"
          }), createVNode(_components.span, {
            style: {
              color: "#79B8FF"
            },
            children: " --version"
          })]
        })]
      })
    }), "\n", createVNode(_components.h2, {
      id: "setting-up-in-packagejson",
      children: "Setting Up in package.json"
    }), "\n", createVNode(_components.p, {
      children: "Add ES Check to your npm scripts for easy usage:"
    }), "\n", createVNode(_components.pre, {
      class: "astro-code github-dark",
      style: {
        backgroundColor: "#24292e",
        color: "#e1e4e8",
        overflowX: "auto"
      },
      tabindex: "0",
      "data-language": "json",
      children: createVNode(_components.code, {
        children: [createVNode(_components.span, {
          class: "line",
          children: createVNode(_components.span, {
            style: {
              color: "#E1E4E8"
            },
            children: "{"
          })
        }), "\n", createVNode(_components.span, {
          class: "line",
          children: [createVNode(_components.span, {
            style: {
              color: "#79B8FF"
            },
            children: "  \"scripts\""
          }), createVNode(_components.span, {
            style: {
              color: "#E1E4E8"
            },
            children: ": {"
          })]
        }), "\n", createVNode(_components.span, {
          class: "line",
          children: [createVNode(_components.span, {
            style: {
              color: "#79B8FF"
            },
            children: "    \"check:es5\""
          }), createVNode(_components.span, {
            style: {
              color: "#E1E4E8"
            },
            children: ": "
          }), createVNode(_components.span, {
            style: {
              color: "#9ECBFF"
            },
            children: "\"es-check es5 './dist/**/*.js'\""
          }), createVNode(_components.span, {
            style: {
              color: "#E1E4E8"
            },
            children: ","
          })]
        }), "\n", createVNode(_components.span, {
          class: "line",
          children: [createVNode(_components.span, {
            style: {
              color: "#79B8FF"
            },
            children: "    \"check:es6\""
          }), createVNode(_components.span, {
            style: {
              color: "#E1E4E8"
            },
            children: ": "
          }), createVNode(_components.span, {
            style: {
              color: "#9ECBFF"
            },
            children: "\"es-check es6 './dist/**/*.js'\""
          }), createVNode(_components.span, {
            style: {
              color: "#E1E4E8"
            },
            children: ","
          })]
        }), "\n", createVNode(_components.span, {
          class: "line",
          children: [createVNode(_components.span, {
            style: {
              color: "#79B8FF"
            },
            children: "    \"check:es-modules\""
          }), createVNode(_components.span, {
            style: {
              color: "#E1E4E8"
            },
            children: ": "
          }), createVNode(_components.span, {
            style: {
              color: "#9ECBFF"
            },
            children: "\"es-check es6 './dist/**/*.js' --module\""
          })]
        }), "\n", createVNode(_components.span, {
          class: "line",
          children: createVNode(_components.span, {
            style: {
              color: "#E1E4E8"
            },
            children: "  }"
          })
        }), "\n", createVNode(_components.span, {
          class: "line",
          children: createVNode(_components.span, {
            style: {
              color: "#E1E4E8"
            },
            children: "}"
          })
        })]
      })
    }), "\n", createVNode(_components.h2, {
      id: "next-steps",
      children: "Next Steps"
    }), "\n", createVNode(_components.ul, {
      children: ["\n", createVNode(_components.li, {
        children: createVNode(_components.a, {
          href: "/documentation/quickstart",
          children: "Quick Start Guide"
        })
      }), "\n", createVNode(_components.li, {
        children: createVNode(_components.a, {
          href: "/documentation/options",
          children: "Configuration Options"
        })
      }), "\n", createVNode(_components.li, {
        children: createVNode(_components.a, {
          href: "/documentation/ci-integration",
          children: "Using with CI/CD"
        })
      }), "\n"]
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

const url = "src/content/docs/installation.mdx";
const file = "/Users/jeffrywainwright/code/oss/es-check/site/src/content/docs/installation.mdx";
const Content = (props = {}) => MDXContent({
  ...props,
  components: { Fragment: Fragment, ...props.components, },
});
Content[Symbol.for('mdx-component')] = true;
Content[Symbol.for('astro.needsHeadRendering')] = !Boolean(frontmatter.layout);
Content.moduleId = "/Users/jeffrywainwright/code/oss/es-check/site/src/content/docs/installation.mdx";
__astro_tag_component__(Content, 'astro:jsx');

export { Content, Content as default, file, frontmatter, getHeadings, url };
