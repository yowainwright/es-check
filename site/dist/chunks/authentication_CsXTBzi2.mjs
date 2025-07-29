import { t as createVNode, F as Fragment, _ as __astro_tag_component__ } from './astro/server_B7dMEJ79.mjs';

const frontmatter = {
  "title": "Authentication",
  "description": "Quasi sapiente voluptates aut minima non doloribus similique quisquam. In quo expedita ipsum nostrum corrupti incidunt. Et aut eligendi ea perferendis."
};
function getHeadings() {
  return [{
    "depth": 2,
    "slug": "overview",
    "text": "Overview"
  }, {
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
    p: "p",
    pre: "pre",
    span: "span",
    strong: "strong",
    ul: "ul",
    ...props.components
  };
  return createVNode(Fragment, {
    children: [createVNode(_components.h2, {
      id: "overview",
      children: "Overview"
    }), "\n", createVNode(_components.p, {
      children: "The Access Shield offers robust authentication mechanisms to ensure secure user access to your application’s resources. It includes features such as user registration, login, session management, OAuth integration, two-factor authentication (2FA), and role-based access control (RBAC)."
    }), "\n", createVNode(_components.ul, {
      children: ["\n", createVNode(_components.li, {
        children: [createVNode(_components.strong, {
          children: "User Registration"
        }), ": Allow users to create new accounts with a chosen username and password."]
      }), "\n", createVNode(_components.li, {
        children: [createVNode(_components.strong, {
          children: "Login"
        }), ": Enable users to authenticate themselves with their credentials."]
      }), "\n", createVNode(_components.li, {
        children: [createVNode(_components.strong, {
          children: "Session Management"
        }), ": Manage user sessions to maintain authentication state across requests."]
      }), "\n", createVNode(_components.li, {
        children: [createVNode(_components.strong, {
          children: "OAuth Integration"
        }), ": Integrate with OAuth providers for seamless authentication via third-party services."]
      }), "\n", createVNode(_components.li, {
        children: [createVNode(_components.strong, {
          children: "Two-Factor Authentication (2FA)"
        }), ": Strengthen account security with an additional layer of authentication."]
      }), "\n", createVNode(_components.li, {
        children: [createVNode(_components.strong, {
          children: "Role-Based Access Control (RBAC)"
        }), ": Control user access to resources based on their roles and permissions."]
      }), "\n"]
    }), "\n", createVNode(_components.h2, {
      id: "getting-started",
      children: "Getting Started"
    }), "\n", createVNode(_components.p, {
      children: "To begin using the authentication features of the Access Shield, you need to initialize the authentication module and configure it according to your application’s requirements."
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
              children: " { Auth } "
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
            children: createVNode(_components.span, {
              style: {
                color: "#6A737D"
              },
              children: "// Initialize the authentication instance"
            })
          }), "\n", createVNode(_components.span, {
            class: "line",
            children: [createVNode(_components.span, {
              style: {
                color: "#F97583"
              },
              children: "const"
            }), createVNode(_components.span, {
              style: {
                color: "#79B8FF"
              },
              children: " auth"
            }), createVNode(_components.span, {
              style: {
                color: "#F97583"
              },
              children: " ="
            }), createVNode(_components.span, {
              style: {
                color: "#F97583"
              },
              children: " new"
            }), createVNode(_components.span, {
              style: {
                color: "#B392F0"
              },
              children: " Auth"
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
            children: createVNode(_components.span, {
              style: {
                color: "#6A737D"
              },
              children: "// Register a new user"
            })
          }), "\n", createVNode(_components.span, {
            class: "line",
            children: [createVNode(_components.span, {
              style: {
                color: "#E1E4E8"
              },
              children: "auth."
            }), createVNode(_components.span, {
              style: {
                color: "#B392F0"
              },
              children: "register"
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
            class: "line"
          }), "\n", createVNode(_components.span, {
            class: "line",
            children: createVNode(_components.span, {
              style: {
                color: "#6A737D"
              },
              children: "// Log in an existing user"
            })
          }), "\n", createVNode(_components.span, {
            class: "line",
            children: [createVNode(_components.span, {
              style: {
                color: "#E1E4E8"
              },
              children: "auth."
            }), createVNode(_components.span, {
              style: {
                color: "#B392F0"
              },
              children: "login"
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
            class: "line"
          }), "\n", createVNode(_components.span, {
            class: "line",
            children: createVNode(_components.span, {
              style: {
                color: "#6A737D"
              },
              children: "// Check if user is authenticated"
            })
          }), "\n", createVNode(_components.span, {
            class: "line",
            children: [createVNode(_components.span, {
              style: {
                color: "#F97583"
              },
              children: "if"
            }), createVNode(_components.span, {
              style: {
                color: "#E1E4E8"
              },
              children: " (auth."
            }), createVNode(_components.span, {
              style: {
                color: "#B392F0"
              },
              children: "isAuthenticated"
            }), createVNode(_components.span, {
              style: {
                color: "#E1E4E8"
              },
              children: "()) {"
            })]
          }), "\n", createVNode(_components.span, {
            class: "line",
            children: createVNode(_components.span, {
              style: {
                color: "#6A737D"
              },
              children: "  // User is authenticated, proceed with accessing secure resources"
            })
          }), "\n", createVNode(_components.span, {
            class: "line",
            children: [createVNode(_components.span, {
              style: {
                color: "#E1E4E8"
              },
              children: "} "
            }), createVNode(_components.span, {
              style: {
                color: "#F97583"
              },
              children: "else"
            }), createVNode(_components.span, {
              style: {
                color: "#E1E4E8"
              },
              children: " {"
            })]
          }), "\n", createVNode(_components.span, {
            class: "line",
            children: createVNode(_components.span, {
              style: {
                color: "#6A737D"
              },
              children: "  // User is not authenticated, redirect to login page"
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

const url = "src/content/docs/authentication.mdx";
const file = "/Users/jeffrywainwright/code/oss/es-check/site/src/content/docs/authentication.mdx";
const Content = (props = {}) => MDXContent({
  ...props,
  components: { Fragment: Fragment, ...props.components, },
});
Content[Symbol.for('mdx-component')] = true;
Content[Symbol.for('astro.needsHeadRendering')] = !Boolean(frontmatter.layout);
Content.moduleId = "/Users/jeffrywainwright/code/oss/es-check/site/src/content/docs/authentication.mdx";
__astro_tag_component__(Content, 'astro:jsx');

export { Content, Content as default, file, frontmatter, getHeadings, url };
