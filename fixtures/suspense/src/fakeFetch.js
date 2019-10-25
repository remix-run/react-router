const responses = {
  "/topics": [
    {
      id: "rendering",
      title: "Rendering"
    },
    {
      id: "state",
      title: "State and Updates"
    },
    {
      id: "effects",
      title: "Effects and Subscriptions"
    }
  ],
  "/topics/rendering": {
    id: "rendering",
    title: "Rendering",
    videos: 10
  },
  "/topics/state": {
    id: "rendering",
    title: "State and Updates",
    videos: 18
  },
  "/topics/effects": {
    id: "effects",
    title: "Effects and Subscriptions",
    videos: 13
  }
};

// Right now we need an application cache because routes naievely call
// `preload` whenever they match. When a promise is thrown, and react rerenders
// when it's resolved, then preload will get called again, so we need a cache
// to prevent starting an infinite loop of promises.  That's why the doc's
// examples put this stuff in state. So, to avoid this, we'll need to keep some
// state inside of a Route, or on the top Router context or something so that
// we only call `preload` during the first render.
const cache = {};

export default function fakeFetch(url) {
  if (cache[url]) {
    return cache[url];
  }
  const resource = wrapPromise(
    new Promise(resolve => {
      setTimeout(() => {
        resolve(responses[url]);
      }, Math.random() * 3000);
    })
  );
  cache[url] = resource;
  return resource;
}

function wrapPromise(promise) {
  let status = "pending";
  let result;
  let suspender = promise.then(
    r => {
      status = "success";
      result = r;
    },
    e => {
      status = "error";
      result = e;
    }
  );
  return {
    read() {
      if (status === "pending") {
        throw suspender;
      } else if (status === "error") {
        throw result;
      } else if (status === "success") {
        return result;
      }
    }
  };
}
