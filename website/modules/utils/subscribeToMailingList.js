import fetch from "isomorphic-fetch";
import qs from "query-string";

function subscribeToMailingList(email) {
  return fetch("https://reacttraining.us16.list-manage.com/subscribe/post", {
    method: "POST",
    mode: "no-cors",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: qs.stringify({
      u: "47df8ab2101d1dd83353427fc",
      id: "83f54bda60",
      MERGE0: email
    })
  });
}

export default subscribeToMailingList;
