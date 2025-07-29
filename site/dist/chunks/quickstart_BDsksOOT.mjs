import { t as createVNode, F as Fragment, _ as __astro_tag_component__ } from './astro/server_B7dMEJ79.mjs';

const frontmatter = {
  "title": "Quick Start",
  "description": "Get up and running with ES Check in minutes"
};
function getHeadings() {
  return [{
    "depth": 1,
    "slug": "quick-start",
    "text": "Quick Start"
  }, {
    "depth": 2,
    "slug": "installation",
    "text": "Installation"
  }, {
    "depth": 2,
    "slug": "basic-usage",
    "text": "Basic Usage"
  }, {
    "depth": 3,
    "slug": "example-1-check-es5-compatibility",
    "text": "Example 1: Check ES5 Compatibility"
  }, {
    "depth": 3,
    "slug": "example-2-check-multiple-directories",
    "text": "Example 2: Check Multiple Directories"
  }, {
    "depth": 3,
    "slug": "example-3-check-es6-modules",
    "text": "Example 3: Check ES6 Modules"
  }, {
    "depth": 2,
    "slug": "common-scenarios",
    "text": "Common Scenarios"
  }, {
    "depth": 3,
    "slug": "production-build-check",
    "text": "Production Build Check"
  }, {
    "depth": 3,
    "slug": "cicd-integration",
    "text": "CI/CD Integration"
  }, {
    "depth": 3,
    "slug": "with-configuration-file",
    "text": "With Configuration File"
  }, {
    "depth": 2,
    "slug": "understanding-output",
    "text": "Understanding Output"
  }, {
    "depth": 3,
    "slug": "success",
    "text": "Success"
  }, {
    "depth": 3,
    "slug": "failure",
    "text": "Failure"
  }, {
    "depth": 2,
    "slug": "whats-next",
    "text": "What’s Next?"
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
      id: "quick-start",
      children: "Quick Start"
    }), "\n", createVNode(_components.p, {
      children: "This guide will help you get started with ES Check in just a few minutes."
    }), "\n", createVNode(_components.h2, {
      id: "installation",
      children: "Installation"
    }), "\n", createVNode(_components.p, {
      children: "First, install ES Check in your project:"
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
    }), "\n", createVNode(_components.h2, {
      id: "basic-usage",
      children: "Basic Usage"
    }), "\n", createVNode(_components.h3, {
      id: "example-1-check-es5-compatibility",
      children: "Example 1: Check ES5 Compatibility"
    }), "\n", createVNode(_components.p, {
      children: "Check if your bundled JavaScript is ES5 compatible:"
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
            children: "npx"
          }), createVNode(_components.span, {
            style: {
              color: "#9ECBFF"
            },
            children: " es-check"
          }), createVNode(_components.span, {
            style: {
              color: "#9ECBFF"
            },
            children: " es5"
          }), createVNode(_components.span, {
            style: {
              color: "#9ECBFF"
            },
            children: " './dist/**/*.js'"
          })]
        })
      })
    }), "\n", createVNode(_components.h3, {
      id: "example-2-check-multiple-directories",
      children: "Example 2: Check Multiple Directories"
    }), "\n", createVNode(_components.p, {
      children: "Check both vendor and distribution files:"
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
            children: "npx"
          }), createVNode(_components.span, {
            style: {
              color: "#9ECBFF"
            },
            children: " es-check"
          }), createVNode(_components.span, {
            style: {
              color: "#9ECBFF"
            },
            children: " es5"
          }), createVNode(_components.span, {
            style: {
              color: "#9ECBFF"
            },
            children: " './vendor/**/*.js'"
          }), createVNode(_components.span, {
            style: {
              color: "#9ECBFF"
            },
            children: " './dist/**/*.js'"
          })]
        })
      })
    }), "\n", createVNode(_components.h3, {
      id: "example-3-check-es6-modules",
      children: "Example 3: Check ES6 Modules"
    }), "\n", createVNode(_components.p, {
      children: ["For ES6 modules, use the ", createVNode(_components.code, {
        children: "--module"
      }), " flag:"]
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
            children: "npx"
          }), createVNode(_components.span, {
            style: {
              color: "#9ECBFF"
            },
            children: " es-check"
          }), createVNode(_components.span, {
            style: {
              color: "#9ECBFF"
            },
            children: " es6"
          }), createVNode(_components.span, {
            style: {
              color: "#9ECBFF"
            },
            children: " './src/**/*.mjs'"
          }), createVNode(_components.span, {
            style: {
              color: "#79B8FF"
            },
            children: " --module"
          })]
        })
      })
    }), "\n", createVNode(_components.h2, {
      id: "common-scenarios",
      children: "Common Scenarios"
    }), "\n", createVNode(_components.h3, {
      id: "production-build-check",
      children: "Production Build Check"
    }), "\n", createVNode(_components.p, {
      children: "Add to your build pipeline:"
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
            children: "    \"build\""
          }), createVNode(_components.span, {
            style: {
              color: "#E1E4E8"
            },
            children: ": "
          }), createVNode(_components.span, {
            style: {
              color: "#9ECBFF"
            },
            children: "\"webpack && npm run check:es\""
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
            children: "    \"check:es\""
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
    }), "\n", createVNode(_components.h3, {
      id: "cicd-integration",
      children: "CI/CD Integration"
    }), "\n", createVNode(_components.pre, {
      class: "astro-code github-dark",
      style: {
        backgroundColor: "#24292e",
        color: "#e1e4e8",
        overflowX: "auto"
      },
      tabindex: "0",
      "data-language": "yaml",
      children: createVNode(_components.code, {
        children: [createVNode(_components.span, {
          class: "line",
          children: createVNode(_components.span, {
            style: {
              color: "#6A737D"
            },
            children: "# Example GitHub Actions"
          })
        }), "\n", createVNode(_components.span, {
          class: "line",
          children: [createVNode(_components.span, {
            style: {
              color: "#E1E4E8"
            },
            children: "- "
          }), createVNode(_components.span, {
            style: {
              color: "#85E89D"
            },
            children: "name"
          }), createVNode(_components.span, {
            style: {
              color: "#E1E4E8"
            },
            children: ": "
          }), createVNode(_components.span, {
            style: {
              color: "#9ECBFF"
            },
            children: "Check ES Version"
          })]
        }), "\n", createVNode(_components.span, {
          class: "line",
          children: [createVNode(_components.span, {
            style: {
              color: "#85E89D"
            },
            children: "  run"
          }), createVNode(_components.span, {
            style: {
              color: "#E1E4E8"
            },
            children: ": "
          }), createVNode(_components.span, {
            style: {
              color: "#9ECBFF"
            },
            children: "npx es-check es5 './dist/**/*.js'"
          })]
        })]
      })
    }), "\n", createVNode(_components.h3, {
      id: "with-configuration-file",
      children: "With Configuration File"
    }), "\n", createVNode(_components.p, {
      children: ["Create ", createVNode(_components.code, {
        children: ".escheckrc"
      }), ":"]
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
            children: "  \"ecmaVersion\""
          }), createVNode(_components.span, {
            style: {
              color: "#E1E4E8"
            },
            children: ": "
          }), createVNode(_components.span, {
            style: {
              color: "#9ECBFF"
            },
            children: "\"es5\""
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
            children: "  \"files\""
          }), createVNode(_components.span, {
            style: {
              color: "#E1E4E8"
            },
            children: ": ["
          }), createVNode(_components.span, {
            style: {
              color: "#9ECBFF"
            },
            children: "\"./dist/**/*.js\""
          }), createVNode(_components.span, {
            style: {
              color: "#E1E4E8"
            },
            children: "],"
          })]
        }), "\n", createVNode(_components.span, {
          class: "line",
          children: [createVNode(_components.span, {
            style: {
              color: "#79B8FF"
            },
            children: "  \"not\""
          }), createVNode(_components.span, {
            style: {
              color: "#E1E4E8"
            },
            children: ": ["
          }), createVNode(_components.span, {
            style: {
              color: "#9ECBFF"
            },
            children: "\"./dist/modern/**/*.js\""
          }), createVNode(_components.span, {
            style: {
              color: "#E1E4E8"
            },
            children: "]"
          })]
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
    }), "\n", createVNode(_components.p, {
      children: "Run with:"
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
            children: "npx"
          }), createVNode(_components.span, {
            style: {
              color: "#9ECBFF"
            },
            children: " es-check"
          })]
        })
      })
    }), "\n", createVNode(_components.h2, {
      id: "understanding-output",
      children: "Understanding Output"
    }), "\n", createVNode(_components.h3, {
      id: "success",
      children: "Success"
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
            children: "✓"
          }), createVNode(_components.span, {
            style: {
              color: "#9ECBFF"
            },
            children: " ES"
          }), createVNode(_components.span, {
            style: {
              color: "#9ECBFF"
            },
            children: " Check"
          }), createVNode(_components.span, {
            style: {
              color: "#9ECBFF"
            },
            children: " passed!"
          }), createVNode(_components.span, {
            style: {
              color: "#9ECBFF"
            },
            children: " All"
          }), createVNode(_components.span, {
            style: {
              color: "#9ECBFF"
            },
            children: " files"
          }), createVNode(_components.span, {
            style: {
              color: "#9ECBFF"
            },
            children: " are"
          }), createVNode(_components.span, {
            style: {
              color: "#9ECBFF"
            },
            children: " ES5"
          }), createVNode(_components.span, {
            style: {
              color: "#9ECBFF"
            },
            children: " compatible."
          })]
        })
      })
    }), "\n", createVNode(_components.h3, {
      id: "failure",
      children: "Failure"
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
          children: [createVNode(_components.span, {
            style: {
              color: "#B392F0"
            },
            children: "✗"
          }), createVNode(_components.span, {
            style: {
              color: "#9ECBFF"
            },
            children: " ES"
          }), createVNode(_components.span, {
            style: {
              color: "#9ECBFF"
            },
            children: " Check"
          }), createVNode(_components.span, {
            style: {
              color: "#9ECBFF"
            },
            children: " failed!"
          })]
        }), "\n", createVNode(_components.span, {
          class: "line",
          children: [createVNode(_components.span, {
            style: {
              color: "#B392F0"
            },
            children: "./dist/app.js"
          }), createVNode(_components.span, {
            style: {
              color: "#9ECBFF"
            },
            children: " -"
          }), createVNode(_components.span, {
            style: {
              color: "#9ECBFF"
            },
            children: " Uses"
          }), createVNode(_components.span, {
            style: {
              color: "#9ECBFF"
            },
            children: " ES6"
          }), createVNode(_components.span, {
            style: {
              color: "#9ECBFF"
            },
            children: " feature:"
          }), createVNode(_components.span, {
            style: {
              color: "#9ECBFF"
            },
            children: " arrow"
          }), createVNode(_components.span, {
            style: {
              color: "#9ECBFF"
            },
            children: " function"
          }), createVNode(_components.span, {
            style: {
              color: "#E1E4E8"
            },
            children: " (line "
          }), createVNode(_components.span, {
            style: {
              color: "#79B8FF"
            },
            children: "10"
          }), createVNode(_components.span, {
            style: {
              color: "#E1E4E8"
            },
            children: ")"
          })]
        }), "\n", createVNode(_components.span, {
          class: "line",
          children: [createVNode(_components.span, {
            style: {
              color: "#B392F0"
            },
            children: "./dist/utils.js"
          }), createVNode(_components.span, {
            style: {
              color: "#9ECBFF"
            },
            children: " -"
          }), createVNode(_components.span, {
            style: {
              color: "#9ECBFF"
            },
            children: " Uses"
          }), createVNode(_components.span, {
            style: {
              color: "#9ECBFF"
            },
            children: " ES6"
          }), createVNode(_components.span, {
            style: {
              color: "#9ECBFF"
            },
            children: " feature:"
          }), createVNode(_components.span, {
            style: {
              color: "#9ECBFF"
            },
            children: " const"
          }), createVNode(_components.span, {
            style: {
              color: "#9ECBFF"
            },
            children: " declaration"
          }), createVNode(_components.span, {
            style: {
              color: "#E1E4E8"
            },
            children: " (line "
          }), createVNode(_components.span, {
            style: {
              color: "#79B8FF"
            },
            children: "5"
          }), createVNode(_components.span, {
            style: {
              color: "#E1E4E8"
            },
            children: ")"
          })]
        })]
      })
    }), "\n", createVNode(_components.h2, {
      id: "whats-next",
      children: "What’s Next?"
    }), "\n", createVNode(_components.ul, {
      children: ["\n", createVNode(_components.li, {
        children: createVNode(_components.a, {
          href: "/documentation/options",
          children: "Explore all command options"
        })
      }), "\n", createVNode(_components.li, {
        children: createVNode(_components.a, {
          href: "/documentation/configuration",
          children: "Configure ES Check for your project"
        })
      }), "\n", createVNode(_components.li, {
        children: createVNode(_components.a, {
          href: "/documentation/debugging",
          children: "Debug ES version issues"
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

const url = "src/content/docs/quickstart.mdx";
const file = "/Users/jeffrywainwright/code/oss/es-check/site/src/content/docs/quickstart.mdx";
const Content = (props = {}) => MDXContent({
  ...props,
  components: { Fragment: Fragment, ...props.components, },
});
Content[Symbol.for('mdx-component')] = true;
Content[Symbol.for('astro.needsHeadRendering')] = !Boolean(frontmatter.layout);
Content.moduleId = "/Users/jeffrywainwright/code/oss/es-check/site/src/content/docs/quickstart.mdx";
__astro_tag_component__(Content, 'astro:jsx');

export { Content, Content as default, file, frontmatter, getHeadings, url };
