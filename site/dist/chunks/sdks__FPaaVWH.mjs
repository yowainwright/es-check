import { t as createVNode, F as Fragment, _ as __astro_tag_component__ } from './astro/server_B7dMEJ79.mjs';

const frontmatter = {
  "title": "SDKs",
  "description": "Discover the supported SDKs by Access Shield for seamless integration into your projects."
};
function getHeadings() {
  return [{
    "depth": 2,
    "slug": "supported-sdks",
    "text": "Supported SDKs"
  }, {
    "depth": 3,
    "slug": "1-javascript-sdk",
    "text": "1. JavaScript SDK"
  }, {
    "depth": 3,
    "slug": "2-typescript-sdk",
    "text": "2. TypeScript SDK"
  }, {
    "depth": 3,
    "slug": "3-python-sdk-coming-soon",
    "text": "3. Python SDK (Coming Soon)"
  }, {
    "depth": 3,
    "slug": "4-java-sdk-planned",
    "text": "4. Java SDK (Planned)"
  }, {
    "depth": 2,
    "slug": "usage",
    "text": "Usage"
  }, {
    "depth": 2,
    "slug": "api-reference",
    "text": "API Reference"
  }, {
    "depth": 2,
    "slug": "support",
    "text": "Support"
  }];
}
function _createMdxContent(props) {
  const _components = {
    a: "a",
    h2: "h2",
    h3: "h3",
    p: "p",
    ...props.components
  };
  return createVNode(Fragment, {
    children: [createVNode(_components.h2, {
      id: "supported-sdks",
      children: "Supported SDKs"
    }), "\n", createVNode(_components.p, {
      children: "Access Shield supports a variety of SDKs to facilitate integration into your projects:"
    }), "\n", createVNode(_components.h3, {
      id: "1-javascript-sdk",
      children: "1. JavaScript SDK"
    }), "\n", createVNode(_components.p, {
      children: "The JavaScript SDK offers a seamless integration experience for JavaScript-based projects. It provides a wrapper for interacting with Access Shield’s authentication features."
    }), "\n", createVNode(_components.h3, {
      id: "2-typescript-sdk",
      children: "2. TypeScript SDK"
    }), "\n", createVNode(_components.p, {
      children: "The TypeScript SDK extends support to TypeScript projects, offering typings and enhanced type safety while leveraging Access Shield’s functionality."
    }), "\n", createVNode(_components.h3, {
      id: "3-python-sdk-coming-soon",
      children: "3. Python SDK (Coming Soon)"
    }), "\n", createVNode(_components.p, {
      children: "Stay tuned for the upcoming Python SDK, designed to empower Python developers with the capabilities of Access Shield for secure authentication in their applications."
    }), "\n", createVNode(_components.h3, {
      id: "4-java-sdk-planned",
      children: "4. Java SDK (Planned)"
    }), "\n", createVNode(_components.p, {
      children: "Our roadmap includes the development of a Java SDK, catering to the Java ecosystem and enabling robust authentication solutions for Java applications."
    }), "\n", createVNode(_components.h2, {
      id: "usage",
      children: "Usage"
    }), "\n", createVNode(_components.p, {
      children: "Integrating Access Shield into your projects is straightforward with our SDKs. Simply refer to the respective documentation for each SDK to find comprehensive usage instructions and examples tailored to your development environment."
    }), "\n", createVNode(_components.h2, {
      id: "api-reference",
      children: "API Reference"
    }), "\n", createVNode(_components.p, {
      children: "Each SDK comes with its own API reference, providing detailed documentation on the methods and functionalities available for seamless authentication integration. Refer to the API reference in the SDK documentation for in-depth information."
    }), "\n", createVNode(_components.h2, {
      id: "support",
      children: "Support"
    }), "\n", createVNode(_components.p, {
      children: ["Should you encounter any issues or have questions during integration, our dedicated support team is here to assist you. Feel free to reach out to us at ", createVNode(_components.a, {
        href: "mailto:support@example.com",
        children: "support@example.com"
      }), " for prompt assistance and guidance."]
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

const url = "src/content/docs/sdks.mdx";
const file = "/Users/jeffrywainwright/code/oss/es-check/site/src/content/docs/sdks.mdx";
const Content = (props = {}) => MDXContent({
  ...props,
  components: { Fragment: Fragment, ...props.components, },
});
Content[Symbol.for('mdx-component')] = true;
Content[Symbol.for('astro.needsHeadRendering')] = !Boolean(frontmatter.layout);
Content.moduleId = "/Users/jeffrywainwright/code/oss/es-check/site/src/content/docs/sdks.mdx";
__astro_tag_component__(Content, 'astro:jsx');

export { Content, Content as default, file, frontmatter, getHeadings, url };
