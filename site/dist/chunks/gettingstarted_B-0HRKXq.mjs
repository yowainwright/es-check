import { t as createVNode, F as Fragment, _ as __astro_tag_component__ } from './astro/server_B7dMEJ79.mjs';

const frontmatter = {
  "title": "Getting Started",
  "description": "Get started with ES Check - Check JavaScript files ES version against a specified ES version"
};
function getHeadings() {
  return [{
    "depth": 1,
    "slug": "getting-started-with-es-check",
    "text": "Getting Started with ES Check"
  }, {
    "depth": 2,
    "slug": "why-es-check",
    "text": "Why ES Check?"
  }, {
    "depth": 2,
    "slug": "installation",
    "text": "Installation"
  }, {
    "depth": 2,
    "slug": "quick-start",
    "text": "Quick Start"
  }, {
    "depth": 2,
    "slug": "basic-usage",
    "text": "Basic Usage"
  }, {
    "depth": 2,
    "slug": "es-versions-supported",
    "text": "ES Versions Supported"
  }, {
    "depth": 2,
    "slug": "configuration-file",
    "text": "Configuration File"
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
    li: "li",
    p: "p",
    pre: "pre",
    span: "span",
    strong: "strong",
    ul: "ul",
    ...props.components
  };
  return createVNode(Fragment, {
    children: [createVNode(_components.h1, {
      id: "getting-started-with-es-check",
      children: "Getting Started with ES Check"
    }), "\n", createVNode(_components.p, {
      children: [createVNode(_components.strong, {
        children: "ES Check"
      }), " checks JavaScript files against a specified version of ECMAScript (ES) with a shell command. If a specified file’s ES version doesn’t match the ES version argument passed in the ES Check command, ES Check will throw an error and log the files that didn’t match the check."]
    }), "\n", createVNode(_components.h2, {
      id: "why-es-check",
      children: "Why ES Check?"
    }), "\n", createVNode(_components.p, {
      children: "In modern JavaScript builds, files are bundled up so they can be served in an optimized manner in the browsers. It is assumed by developers that future JavaScript—like ES8 will be transpiled (changed from future JavaScript to current JavaScript) appropriately by a tool like Babel. Sometimes there is an issue where files are not transpiled. There was no efficient way to test for files that weren’t transpiled—until now. That’s what ES Check does."
    }), "\n", createVNode(_components.h2, {
      id: "installation",
      children: "Installation"
    }), "\n", createVNode(_components.p, {
      children: "Install ES Check locally or globally:"
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
            children: "npm"
          }), createVNode(_components.span, {
            style: {
              color: "#9ECBFF"
            },
            children: " i"
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
          }), createVNode(_components.span, {
            style: {
              color: "#6A737D"
            },
            children: "   # locally"
          })]
        }), "\n", createVNode(_components.span, {
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
            children: " i"
          }), createVNode(_components.span, {
            style: {
              color: "#9ECBFF"
            },
            children: " es-check"
          }), createVNode(_components.span, {
            style: {
              color: "#79B8FF"
            },
            children: " -g"
          }), createVNode(_components.span, {
            style: {
              color: "#6A737D"
            },
            children: "           # or globally"
          })]
        })]
      })
    }), "\n", createVNode(_components.h2, {
      id: "quick-start",
      children: "Quick Start"
    }), "\n", createVNode(_components.p, {
      children: "Check if an array or glob of files matches a specified ES version:"
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
            children: "es-check"
          }), createVNode(_components.span, {
            style: {
              color: "#9ECBFF"
            },
            children: " es5"
          }), createVNode(_components.span, {
            style: {
              color: "#9ECBFF"
            },
            children: " './vendor/js/*.js'"
          }), createVNode(_components.span, {
            style: {
              color: "#9ECBFF"
            },
            children: " './dist/**/*.js'"
          })]
        })
      })
    }), "\n", createVNode(_components.p, {
      children: ["The ES Check script above checks ", createVNode(_components.code, {
        children: "/dist/*.js"
      }), " files to see if they’re ES5. It throws an error and logs files that do not pass the check."]
    }), "\n", createVNode(_components.h2, {
      id: "basic-usage",
      children: "Basic Usage"
    }), "\n", createVNode(_components.p, {
      children: "ES Check is a shell command CLI that takes in two arguments: an ECMAScript version and files in globs."
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
            children: "# Check single directory"
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
              color: "#9ECBFF"
            },
            children: " es6"
          }), createVNode(_components.span, {
            style: {
              color: "#9ECBFF"
            },
            children: " ./js/"
          }), createVNode(_components.span, {
            style: {
              color: "#79B8FF"
            },
            children: "*"
          }), createVNode(_components.span, {
            style: {
              color: "#9ECBFF"
            },
            children: ".js"
          })]
        }), "\n", createVNode(_components.span, {
          class: "line"
        }), "\n", createVNode(_components.span, {
          class: "line",
          children: createVNode(_components.span, {
            style: {
              color: "#6A737D"
            },
            children: "# Check multiple directories"
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
              color: "#9ECBFF"
            },
            children: " es6"
          }), createVNode(_components.span, {
            style: {
              color: "#9ECBFF"
            },
            children: " ./js/"
          }), createVNode(_components.span, {
            style: {
              color: "#79B8FF"
            },
            children: "*"
          }), createVNode(_components.span, {
            style: {
              color: "#9ECBFF"
            },
            children: ".js"
          }), createVNode(_components.span, {
            style: {
              color: "#9ECBFF"
            },
            children: " ./dist/"
          }), createVNode(_components.span, {
            style: {
              color: "#79B8FF"
            },
            children: "*"
          }), createVNode(_components.span, {
            style: {
              color: "#9ECBFF"
            },
            children: ".js"
          })]
        })]
      })
    }), "\n", createVNode(_components.h2, {
      id: "es-versions-supported",
      children: "ES Versions Supported"
    }), "\n", createVNode(_components.p, {
      children: "ES Check supports the following ECMAScript versions:"
    }), "\n", createVNode(_components.ul, {
      children: ["\n", createVNode(_components.li, {
        children: "es3"
      }), "\n", createVNode(_components.li, {
        children: "es4"
      }), "\n", createVNode(_components.li, {
        children: "es5"
      }), "\n", createVNode(_components.li, {
        children: "es6/es2015"
      }), "\n", createVNode(_components.li, {
        children: "es7/es2016"
      }), "\n", createVNode(_components.li, {
        children: "es8/es2017"
      }), "\n", createVNode(_components.li, {
        children: "es9/es2018"
      }), "\n", createVNode(_components.li, {
        children: "es10/es2019"
      }), "\n", createVNode(_components.li, {
        children: "es11/es2020"
      }), "\n", createVNode(_components.li, {
        children: "es12/es2021"
      }), "\n", createVNode(_components.li, {
        children: "es13/es2022"
      }), "\n", createVNode(_components.li, {
        children: "es14/es2023"
      }), "\n"]
    }), "\n", createVNode(_components.h2, {
      id: "configuration-file",
      children: "Configuration File"
    }), "\n", createVNode(_components.p, {
      children: ["For consistent configuration, create a ", createVNode(_components.code, {
        children: ".escheckrc"
      }), " file in JSON format:"]
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
            children: "\"es6\""
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
            children: "  \"module\""
          }), createVNode(_components.span, {
            style: {
              color: "#E1E4E8"
            },
            children: ": "
          }), createVNode(_components.span, {
            style: {
              color: "#79B8FF"
            },
            children: "false"
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
            children: ": "
          }), createVNode(_components.span, {
            style: {
              color: "#9ECBFF"
            },
            children: "\"./dist/**/*.js\""
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
            children: "\"./dist/skip/*.js\""
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
            children: "  \"checkFeatures\""
          }), createVNode(_components.span, {
            style: {
              color: "#E1E4E8"
            },
            children: ": "
          }), createVNode(_components.span, {
            style: {
              color: "#79B8FF"
            },
            children: "true"
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
      children: "Then run ES Check without arguments:"
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
          children: createVNode(_components.span, {
            style: {
              color: "#B392F0"
            },
            children: "es-check"
          })
        })
      })
    }), "\n", createVNode(_components.h2, {
      id: "next-steps",
      children: "Next Steps"
    }), "\n", createVNode(_components.ul, {
      children: ["\n", createVNode(_components.li, {
        children: createVNode(_components.a, {
          href: "/documentation/options",
          children: "Explore command options"
        })
      }), "\n", createVNode(_components.li, {
        children: createVNode(_components.a, {
          href: "/documentation/features",
          children: "Check ES version specific features"
        })
      }), "\n", createVNode(_components.li, {
        children: createVNode(_components.a, {
          href: "/documentation/browserslist",
          children: "Set up browserslist integration"
        })
      }), "\n", createVNode(_components.li, {
        children: createVNode(_components.a, {
          href: "/documentation/debugging",
          children: "Debug errors effectively"
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

const url = "src/content/docs/gettingstarted.mdx";
const file = "/Users/jeffrywainwright/code/oss/es-check/site/src/content/docs/gettingstarted.mdx";
const Content = (props = {}) => MDXContent({
  ...props,
  components: { Fragment: Fragment, ...props.components, },
});
Content[Symbol.for('mdx-component')] = true;
Content[Symbol.for('astro.needsHeadRendering')] = !Boolean(frontmatter.layout);
Content.moduleId = "/Users/jeffrywainwright/code/oss/es-check/site/src/content/docs/gettingstarted.mdx";
__astro_tag_component__(Content, 'astro:jsx');

export { Content, Content as default, file, frontmatter, getHeadings, url };
