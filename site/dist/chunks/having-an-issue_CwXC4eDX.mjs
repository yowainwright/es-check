import { t as createVNode, F as Fragment, _ as __astro_tag_component__ } from './astro/server_B7dMEJ79.mjs';

const frontmatter = {
  "title": "Report an Issue",
  "description": "Quasi sapiente voluptates aut minima non doloribus similique quisquam. In quo expedita ipsum nostrum corrupti incidunt. Et aut eligendi ea perferendis."
};
function getHeadings() {
  return [{
    "depth": 2,
    "slug": "how-to-report-an-issue",
    "text": "How to Report an Issue"
  }];
}
function _createMdxContent(props) {
  const _components = {
    h2: "h2",
    li: "li",
    ol: "ol",
    p: "p",
    strong: "strong",
    ...props.components
  };
  return createVNode(Fragment, {
    children: [createVNode(_components.h2, {
      id: "how-to-report-an-issue",
      children: "How to Report an Issue"
    }), "\n", createVNode(_components.p, {
      children: "If you encounter a problem or have a suggestion for improvement, we encourage you to report it. Here’s how you can do that:"
    }), "\n", createVNode(_components.ol, {
      children: ["\n", createVNode(_components.li, {
        children: ["\n", createVNode(_components.p, {
          children: [createVNode(_components.strong, {
            children: "Navigate to the “Issues” tab"
          }), ": Go to the GitHub repository of our project."]
        }), "\n"]
      }), "\n", createVNode(_components.li, {
        children: ["\n", createVNode(_components.p, {
          children: [createVNode(_components.strong, {
            children: "Check existing issues"
          }), ": Before creating a new issue, search through the existing ones to see if your problem has already been reported. If you find a similar issue, you can add a comment to provide additional details or subscribe to receive updates."]
        }), "\n"]
      }), "\n", createVNode(_components.li, {
        children: ["\n", createVNode(_components.p, {
          children: [createVNode(_components.strong, {
            children: "Create a new issue"
          }), ": If you couldn’t find an existing issue that matches yours, click on the “New issue” button."]
        }), "\n"]
      }), "\n", createVNode(_components.li, {
        children: ["\n", createVNode(_components.p, {
          children: [createVNode(_components.strong, {
            children: "Provide a clear title and description"
          }), ": Give your issue a descriptive title that summarizes the problem or suggestion. In the description, include detailed steps to reproduce the issue (if applicable) and any relevant information about your environment."]
        }), "\n"]
      }), "\n", createVNode(_components.li, {
        children: ["\n", createVNode(_components.p, {
          children: [createVNode(_components.strong, {
            children: "Attach screenshots or code snippets"
          }), ": If applicable, include screenshots or code snippets to help illustrate the issue you’re experiencing."]
        }), "\n"]
      }), "\n", createVNode(_components.li, {
        children: ["\n", createVNode(_components.p, {
          children: [createVNode(_components.strong, {
            children: "Submit the issue"
          }), ": Once you’ve filled out all the necessary information, click on the “Submit new issue” button."]
        }), "\n"]
      }), "\n"]
    }), "\n", createVNode(_components.p, {
      children: "That’s it! Your issue will be reviewed by our team, and we’ll do our best to address it as soon as possible."
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

const url = "src/content/docs/having-an-issue.mdx";
const file = "/Users/jeffrywainwright/code/oss/es-check/site/src/content/docs/having-an-issue.mdx";
const Content = (props = {}) => MDXContent({
  ...props,
  components: { Fragment: Fragment, ...props.components, },
});
Content[Symbol.for('mdx-component')] = true;
Content[Symbol.for('astro.needsHeadRendering')] = !Boolean(frontmatter.layout);
Content.moduleId = "/Users/jeffrywainwright/code/oss/es-check/site/src/content/docs/having-an-issue.mdx";
__astro_tag_component__(Content, 'astro:jsx');

export { Content, Content as default, file, frontmatter, getHeadings, url };
