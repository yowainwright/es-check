import { t as createVNode, F as Fragment, _ as __astro_tag_component__ } from './astro/server_B7dMEJ79.mjs';

const frontmatter = {
  "title": "Contributing Guidelines",
  "description": "Quasi sapiente voluptates aut minima non doloribus similique quisquam. In quo expedita ipsum nostrum corrupti incidunt. Et aut eligendi ea perferendis."
};
function getHeadings() {
  return [{
    "depth": 2,
    "slug": "guidelines-for-contibutors",
    "text": "Guidelines for contibutors"
  }];
}
function _createMdxContent(props) {
  const _components = {
    code: "code",
    h2: "h2",
    li: "li",
    ol: "ol",
    p: "p",
    strong: "strong",
    ul: "ul",
    ...props.components
  };
  return createVNode(Fragment, {
    children: [createVNode(_components.h2, {
      id: "guidelines-for-contibutors",
      children: "Guidelines for contibutors"
    }), "\n", createVNode(_components.ol, {
      children: ["\n", createVNode(_components.li, {
        children: ["\n", createVNode(_components.p, {
          children: [createVNode(_components.strong, {
            children: "Fork"
          }), " the repository and ", createVNode(_components.strong, {
            children: "clone"
          }), " it to your local machine."]
        }), "\n"]
      }), "\n", createVNode(_components.li, {
        children: ["\n", createVNode(_components.p, {
          children: [createVNode(_components.strong, {
            children: "Create a branch"
          }), " for your contribution. Use a descriptive name for your branch."]
        }), "\n"]
      }), "\n", createVNode(_components.li, {
        children: ["\n", createVNode(_components.p, {
          children: [createVNode(_components.strong, {
            children: "Commit"
          }), " your changes with clear and concise messages."]
        }), "\n"]
      }), "\n", createVNode(_components.li, {
        children: ["\n", createVNode(_components.p, {
          children: [createVNode(_components.strong, {
            children: "Push"
          }), " your changes to your fork."]
        }), "\n"]
      }), "\n", createVNode(_components.li, {
        children: ["\n", createVNode(_components.p, {
          children: [createVNode(_components.strong, {
            children: "Submit a pull request"
          }), " (PR) to the ", createVNode(_components.code, {
            children: "main"
          }), " branch of the original repository."]
        }), "\n"]
      }), "\n", createVNode(_components.li, {
        children: ["\n", createVNode(_components.p, {
          children: "Ensure your PR includes:"
        }), "\n", createVNode(_components.ul, {
          children: ["\n", createVNode(_components.li, {
            children: "A descriptive title summarizing the changes."
          }), "\n", createVNode(_components.li, {
            children: "Detailed information in the description about the problem and solution."
          }), "\n"]
        }), "\n"]
      }), "\n", createVNode(_components.li, {
        children: ["\n", createVNode(_components.p, {
          children: [createVNode(_components.strong, {
            children: "Be responsive"
          }), " to feedback and comments on your PR. Make any requested changes promptly."]
        }), "\n"]
      }), "\n", createVNode(_components.li, {
        children: ["\n", createVNode(_components.p, {
          children: "Before submitting your PR, ensure:"
        }), "\n", createVNode(_components.ul, {
          children: ["\n", createVNode(_components.li, {
            children: "Your code follows the project’s style guidelines."
          }), "\n", createVNode(_components.li, {
            children: "You have included relevant tests (if applicable)."
          }), "\n", createVNode(_components.li, {
            children: "You have updated documentation (if necessary)."
          }), "\n"]
        }), "\n"]
      }), "\n", createVNode(_components.li, {
        children: ["\n", createVNode(_components.p, {
          children: "By contributing, you agree that your work will be licensed under the project’s license."
        }), "\n"]
      }), "\n"]
    }), "\n", createVNode(_components.p, {
      children: "Thank you for your contribution!"
    }), "\n", createVNode(_components.p, {
      children: "If you have any questions or need further assistance, feel free to reach out to us. We’re here to help!"
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

const url = "src/content/docs/contributing-guideline.mdx";
const file = "/Users/jeffrywainwright/code/oss/es-check/site/src/content/docs/contributing-guideline.mdx";
const Content = (props = {}) => MDXContent({
  ...props,
  components: { Fragment: Fragment, ...props.components, },
});
Content[Symbol.for('mdx-component')] = true;
Content[Symbol.for('astro.needsHeadRendering')] = !Boolean(frontmatter.layout);
Content.moduleId = "/Users/jeffrywainwright/code/oss/es-check/site/src/content/docs/contributing-guideline.mdx";
__astro_tag_component__(Content, 'astro:jsx');

export { Content, Content as default, file, frontmatter, getHeadings, url };
