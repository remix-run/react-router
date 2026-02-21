import { expect, test } from "@playwright/test";
import { matchPath } from "react-router";

test("matchPath should consistently decode path parameters", function () {
  const result = matchPath(
    "/department/:departmentId/ticket/:ticketId/comment/:commentId/reaction/:reactionId",
    "/department/1a%2F2b/ticket/3c%3F4d/comment/5e%3A6f/reaction/7g%2C8h"
  );

  expect(result?.params).toMatchObject({
    departmentId: "1a/2b",
    ticketId: "3c?4d",
    commentId: "5e:6f",
    reactionId: "7g,8h",
  });
});
