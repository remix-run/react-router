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

export default function fakeFetch(url) {
  return new Promise(resolve => {
    setTimeout(() => resolve(responses[url]), 1000);
  });
}
