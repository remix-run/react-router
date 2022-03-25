import type { History } from "../../history";

export default function EncodeReservedCharacters(history: History) {
  let pathname;

  // encoded string
  pathname = "/view/%23abc";
  history.replace(pathname);
  expect(history.location).toMatchObject({
    pathname: "/view/%23abc",
  });

  // encoded object
  pathname = "/view/%23abc";
  history.replace({ pathname });
  expect(history.location).toMatchObject({
    pathname: "/view/%23abc",
  });

  // unencoded string
  pathname = "/view/#abc";
  history.replace(pathname);
  expect(history.location).toMatchObject({
    pathname: "/view/",
    hash: "#abc",
  });
}
