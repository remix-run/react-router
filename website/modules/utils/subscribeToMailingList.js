import fetch from "isomorphic-fetch";
import qs from "query-string";

export default function subscribeToMailingList(email) {
  return fetch("https://api.convertkit.com/v3/forms/852704/subscribe", {
    method: "POST",
    mode: "no-cors",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: qs.stringify({
      api_key: "617ze_vOpzLKL9yB_BbsXQ",
      email
    })
  });
}
