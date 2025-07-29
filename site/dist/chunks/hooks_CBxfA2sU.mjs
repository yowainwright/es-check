import { t as createVNode, F as Fragment, _ as __astro_tag_component__ } from './astro/server_B7dMEJ79.mjs';

const frontmatter = {
  "title": "Hooks Guide",
  "description": "Quasi sapiente voluptates aut minima non doloribus similique quisquam. In quo expedita ipsum nostrum corrupti incidunt. Et aut eligendi ea perferendis."
};
function getHeadings() {
  return [{
    "depth": 2,
    "slug": "overview",
    "text": "Overview"
  }, {
    "depth": 2,
    "slug": "available-hooks",
    "text": "Available Hooks"
  }, {
    "depth": 3,
    "slug": "useauthentication",
    "text": "useAuthentication"
  }, {
    "depth": 3,
    "slug": "useuser",
    "text": "useUser"
  }, {
    "depth": 3,
    "slug": "useerror",
    "text": "useError"
  }, {
    "depth": 2,
    "slug": "usage",
    "text": "Usage"
  }];
}
function _createMdxContent(props) {
  const _components = {
    code: "code",
    h2: "h2",
    h3: "h3",
    p: "p",
    pre: "pre",
    span: "span",
    ...props.components
  };
  return createVNode(Fragment, {
    children: [createVNode(_components.h2, {
      id: "overview",
      children: "Overview"
    }), "\n", createVNode(_components.p, {
      children: "Hooks are a powerful feature in Access Shield that allow you to integrate authentication functionality into your React application with ease. By using hooks, you can access authentication state and perform authentication-related actions within your components."
    }), "\n", createVNode(_components.h2, {
      id: "available-hooks",
      children: "Available Hooks"
    }), "\n", createVNode(_components.p, {
      children: "Our Authentication Library provides the following hooks:"
    }), "\n", createVNode(_components.h3, {
      id: "useauthentication",
      children: createVNode(_components.code, {
        children: "useAuthentication"
      })
    }), "\n", createVNode(_components.p, {
      children: ["The ", createVNode(_components.code, {
        children: "useAuthentication"
      }), " hook allows you to access the authentication state and perform authentication-related actions, such as login, logout, and checking authentication status."]
    }), "\n", createVNode(_components.h3, {
      id: "useuser",
      children: createVNode(_components.code, {
        children: "useUser"
      })
    }), "\n", createVNode(_components.p, {
      children: ["The ", createVNode(_components.code, {
        children: "useUser"
      }), " hook allows you to access the user object, including user information and authentication status."]
    }), "\n", createVNode(_components.h3, {
      id: "useerror",
      children: createVNode(_components.code, {
        children: "useError"
      })
    }), "\n", createVNode(_components.p, {
      children: ["The ", createVNode(_components.code, {
        children: "useError"
      }), " hook allows you to access and handle authentication errors."]
    }), "\n", createVNode(_components.h2, {
      id: "usage",
      children: "Usage"
    }), "\n", createVNode(_components.p, {
      children: ["Here’s an example of how to use the ", createVNode(_components.code, {
        children: "useAuthentication"
      }), " hook:"]
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
        "data-language": "jsx",
        children: createVNode(_components.code, {
          children: [createVNode(_components.span, {
            class: "line",
            children: [createVNode(_components.span, {
              style: {
                color: "#F97583"
              },
              children: "import"
            }), createVNode(_components.span, {
              style: {
                color: "#E1E4E8"
              },
              children: " { useAuthentication } "
            }), createVNode(_components.span, {
              style: {
                color: "#F97583"
              },
              children: "from"
            }), createVNode(_components.span, {
              style: {
                color: "#9ECBFF"
              },
              children: " 'access-shield'"
            }), createVNode(_components.span, {
              style: {
                color: "#E1E4E8"
              },
              children: ";"
            })]
          }), "\n", createVNode(_components.span, {
            class: "line"
          }), "\n", createVNode(_components.span, {
            class: "line",
            children: [createVNode(_components.span, {
              style: {
                color: "#F97583"
              },
              children: "function"
            }), createVNode(_components.span, {
              style: {
                color: "#B392F0"
              },
              children: " LoginButton"
            }), createVNode(_components.span, {
              style: {
                color: "#E1E4E8"
              },
              children: "() {"
            })]
          }), "\n", createVNode(_components.span, {
            class: "line",
            children: [createVNode(_components.span, {
              style: {
                color: "#F97583"
              },
              children: "  const"
            }), createVNode(_components.span, {
              style: {
                color: "#E1E4E8"
              },
              children: " { "
            }), createVNode(_components.span, {
              style: {
                color: "#79B8FF"
              },
              children: "login"
            }), createVNode(_components.span, {
              style: {
                color: "#E1E4E8"
              },
              children: " } "
            }), createVNode(_components.span, {
              style: {
                color: "#F97583"
              },
              children: "="
            }), createVNode(_components.span, {
              style: {
                color: "#B392F0"
              },
              children: " useAuthentication"
            }), createVNode(_components.span, {
              style: {
                color: "#E1E4E8"
              },
              children: "();"
            })]
          }), "\n", createVNode(_components.span, {
            class: "line"
          }), "\n", createVNode(_components.span, {
            class: "line",
            children: [createVNode(_components.span, {
              style: {
                color: "#F97583"
              },
              children: "  const"
            }), createVNode(_components.span, {
              style: {
                color: "#B392F0"
              },
              children: " handleLogin"
            }), createVNode(_components.span, {
              style: {
                color: "#F97583"
              },
              children: " ="
            }), createVNode(_components.span, {
              style: {
                color: "#E1E4E8"
              },
              children: " () "
            }), createVNode(_components.span, {
              style: {
                color: "#F97583"
              },
              children: "=>"
            }), createVNode(_components.span, {
              style: {
                color: "#E1E4E8"
              },
              children: " {"
            })]
          }), "\n", createVNode(_components.span, {
            class: "line",
            children: [createVNode(_components.span, {
              style: {
                color: "#B392F0"
              },
              children: "    login"
            }), createVNode(_components.span, {
              style: {
                color: "#E1E4E8"
              },
              children: "("
            }), createVNode(_components.span, {
              style: {
                color: "#9ECBFF"
              },
              children: "'username'"
            }), createVNode(_components.span, {
              style: {
                color: "#E1E4E8"
              },
              children: ", "
            }), createVNode(_components.span, {
              style: {
                color: "#9ECBFF"
              },
              children: "'password'"
            }), createVNode(_components.span, {
              style: {
                color: "#E1E4E8"
              },
              children: ");"
            })]
          }), "\n", createVNode(_components.span, {
            class: "line",
            children: createVNode(_components.span, {
              style: {
                color: "#E1E4E8"
              },
              children: "  };"
            })
          }), "\n", createVNode(_components.span, {
            class: "line"
          }), "\n", createVNode(_components.span, {
            class: "line",
            children: [createVNode(_components.span, {
              style: {
                color: "#F97583"
              },
              children: "  return"
            }), createVNode(_components.span, {
              style: {
                color: "#E1E4E8"
              },
              children: " ("
            })]
          }), "\n", createVNode(_components.span, {
            class: "line",
            children: [createVNode(_components.span, {
              style: {
                color: "#E1E4E8"
              },
              children: "    <"
            }), createVNode(_components.span, {
              style: {
                color: "#85E89D"
              },
              children: "button"
            }), createVNode(_components.span, {
              style: {
                color: "#B392F0"
              },
              children: " onClick"
            }), createVNode(_components.span, {
              style: {
                color: "#F97583"
              },
              children: "="
            }), createVNode(_components.span, {
              style: {
                color: "#E1E4E8"
              },
              children: "{handleLogin}>Login</"
            }), createVNode(_components.span, {
              style: {
                color: "#85E89D"
              },
              children: "button"
            }), createVNode(_components.span, {
              style: {
                color: "#E1E4E8"
              },
              children: ">"
            })]
          }), "\n", createVNode(_components.span, {
            class: "line",
            children: createVNode(_components.span, {
              style: {
                color: "#E1E4E8"
              },
              children: "  );"
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

const url = "src/content/docs/hooks.mdx";
const file = "/Users/jeffrywainwright/code/oss/es-check/site/src/content/docs/hooks.mdx";
const Content = (props = {}) => MDXContent({
  ...props,
  components: { Fragment: Fragment, ...props.components, },
});
Content[Symbol.for('mdx-component')] = true;
Content[Symbol.for('astro.needsHeadRendering')] = !Boolean(frontmatter.layout);
Content.moduleId = "/Users/jeffrywainwright/code/oss/es-check/site/src/content/docs/hooks.mdx";
__astro_tag_component__(Content, 'astro:jsx');

export { Content, Content as default, file, frontmatter, getHeadings, url };
