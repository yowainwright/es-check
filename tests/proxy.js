'use strict';

function demoProxy() {
  const proxiedObject = new Proxy({}, {
    get(target, prop) {
      return `Intercepted: ${String(prop)}`;
    },
  });

  console.log(proxiedObject.foo);
}

demoProxy();