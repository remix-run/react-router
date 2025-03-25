import * as React from 'react';
// import * as ReactDOM from 'react-dom/client';
import { act } from "react-dom/test-utils";
import { MemoryRouter as TestMemoryRouter, Routes, Route, useMagicSearchParams } from "../../index"
// import renderHook from jest
import { renderHook } from "@testing-library/react";

import { paramsUsers } from "./constants-test/defaultParamsPage";

// Wrapper component to provide Router context
function Wrapper({
  children,
  initialEntries = ["/"],
}: {
  children: React.ReactNode;
  initialEntries?: string[];
}) {
  return (
    <TestMemoryRouter initialEntries={initialEntries}>
      <Routes>
        <Route path="/" element={children} />
      </Routes>
    </TestMemoryRouter>
  );
}

describe("useMagicSearchParams Hook", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  it("Should return mandatory parameters at the start (getParams)", () => {
    const { result } = renderHook(
      () =>
        useMagicSearchParams({
          ...paramsUsers,
          forceParams: { page_size: 10 },
        }),
      { wrapper: Wrapper }
    );

    const { page, page_size } = result.current.getParams({ convert: true });
    expect(page).toBe(1);
    expect(page_size).toBe(10);
  });

  it("Should update parameters (updateParams) and reflect them in getParams", () => {
    const { result } = renderHook(
      () =>
        useMagicSearchParams({
          ...paramsUsers,
          defaultParams: paramsUsers.mandatory,
        }),
      { wrapper: Wrapper }
    );

    act(() => {
      // ...simulate code for updating params...
      // @ts-ignore
      result.current.updateParams({ page: 2, search: "test" });
    });

    const { page, search } = result.current.getParams({ convert: true });
    expect(page).toBe(2);
    expect(search).toBe("test");
  });

  it("Should force a parameter (forceParams) and not allow manual change", () => {
    const { result } = renderHook(
      () =>
        useMagicSearchParams({
          ...paramsUsers,
          // @ts-ignore
          forceParams: { page_size: 5 },
        }),
      { wrapper: Wrapper }
    );

    act(() => {
      // ...attempt to change page_size manually...
      // @ts-ignore
      result.current.updateParams({ page_size: 20 });
    });

    const { page_size } = result.current.getParams({ convert: true });
    expect(page_size).toBe(5); // Remains forced
  });

  it("Should omit indicated values (omitParamsByValues)", () => {
    const { result } = renderHook(
      () =>
        useMagicSearchParams({
          ...paramsUsers,
          omitParamsByValues: ["all", "default"],
        }),
      { wrapper: Wrapper }
    );

    act(() => {
      result.current.updateParams({ newParams: { order: "all", page: 3 } });
    });

    const { page, order } = result.current.getParams({ convert: true });
    // 'all' is omitted
    expect(page).toBe(3);
    expect(order).toBe(undefined); // 'all' is omitted so it should not exist
  });

  it("clearParams should reset to default values (keeping mandatory)", () => {
    const { result } = renderHook(
      () =>
        useMagicSearchParams({
          ...paramsUsers,
          defaultParams: paramsUsers.mandatory,
        }),
      { wrapper: Wrapper }
    );

    act(() => {
      result.current.updateParams({ newParams: { page: 8, order: "asc" } });
    });

    const { page, order } = result.current.getParams({ convert: true });
    expect(page).toBe(8);
    expect(order).toBe("asc");

    act(() => {
      result.current.clearParams();
    });

    const newParams = result.current.getParams({ convert: true });
    expect(newParams.page).toBe(8); // mandatory from paramsUsers
    expect(newParams.order).toBe(undefined); // optional should no longer exist in the URL
  });
  it("Should preserve existing parameters not updated when updating other parameters", () => {
    const { result } = renderHook(
      () =>
        useMagicSearchParams({
          ...paramsUsers,
          defaultParams: paramsUsers.mandatory,
        }),
      { wrapper: Wrapper }
    );

    act(() => {
      result.current.updateParams({ newParams: { search: "newSearch" } });
    });

    const { page, page_size, search, order } = result.current.getParams({
      convert: true,
    });
    expect(page).toBe(1); // default mandatory
    expect(page_size).toBe(10); // default mandatory
    expect(search).toBe("newSearch"); // updated
    expect(order).toBe(undefined); // unchanged optional
  });
  it("Should maintain forced parameters after multiple updates", () => {
    const { result } = renderHook(
      () =>
        useMagicSearchParams({
          ...paramsUsers,
          forceParams: { page_size: 10 },
          omitParamsByValues: ["all", "default"],
        }),
      { wrapper: Wrapper }
    );

    act(() => {
      result.current.updateParams({ newParams: { page: 2, search: "test" } });
    });

    const { page, page_size, search } = result.current.getParams({
      convert: true,
    });
    expect(page).toBe(2);
    expect(page_size).toBe(10); // forced
    expect(search).toBe("test");

    act(() => {
      result.current.updateParams({
        newParams: { page: 3, search: "anotherTest" },
      });
    });

    const updatedParams = result.current.getParams({ convert: true });
    expect(updatedParams.page).toBe(3);
    expect(updatedParams.page_size).toBe(10); // still forced
    expect(updatedParams.search).toBe("anotherTest");
  });

  // Section for array serialization tests

  it("Should add and remove an individual tag in repeat mode", () => {
    const { result } = renderHook(
      () =>
        useMagicSearchParams({
          ...paramsUsers,
          defaultParams: paramsUsers.mandatory,
          arraySerialization: "repeat",
        }),
      { wrapper: Wrapper }
    );

    // Initial tags are expected to be unique: ['uno', 'dos', 'tres']
    const initialParams = result.current.getParams({ convert: true });
    expect(initialParams.tags).toEqual(["uno", "dos", "tres"]);

    // Add a new tag 'nuevo'
    act(() => {
      // @ts-ignore
      result.current.updateParams({ newParams: { tags: "nuevo" } });
    });
    let updatedParams = result.current.getParams({ convert: true });
    expect(updatedParams.tags).toEqual(["uno", "dos", "tres", "nuevo"]);

    // Sending the same tag 'nuevo' again removes it (toggle)
    act(() => {
      // @ts-ignore
      result.current.updateParams({ newParams: { tags: "nuevo" } });
    });
    updatedParams = result.current.getParams({ convert: true });
    expect(updatedParams.tags).toEqual(["uno", "dos", "tres"]);
  });

  it("Should allow the developer to combine tag arrays, controlling what is kept", () => {
    const { result } = renderHook(
      () =>
        useMagicSearchParams({
          ...paramsUsers,
          defaultParams: paramsUsers.mandatory,
          arraySerialization: "repeat",
        }),
      { wrapper: Wrapper }
    );

    // Verify that the initial tags are: ['uno', 'dos', 'tres']
    const initialParams = result.current.getParams({ convert: true });
    expect(initialParams.tags).toEqual(["uno", "dos", "tres"]);

    // The developer decides to manually combine:
    // Take the current tags and add the new ones, filtering duplicates.
    const newTags = ["react", "dos", "nuevo"];
    const combinedTags = [
      ...initialParams.tags,
      // @ts-ignore
      ...newTags.filter((tag) => !initialParams.tags.includes(tag)),
    ];

    act(() => {
      // @ts-ignore
      result.current.updateParams({ newParams: { tags: combinedTags } });
    });

    const updatedParams = result.current.getParams({ convert: true });
    // The manual union of both arrays without duplicates is expected
    expect(updatedParams.tags).toEqual([
      "uno",
      "dos",
      "tres",
      "react",
      "nuevo",
    ]);
  });
});

// ARRAY COMBINATION TEST ----------------------

describe("Array serialization test in getParams", () => {
  it("Should convert tags to array in CSV mode when using convert:true", () => {
    const initialEntries = ["/?tags=uno,dos,tres"];
    const { result } = renderHook(
      () =>
        useMagicSearchParams({
          ...paramsUsers,
          arraySerialization: "csv",
        }),
      {
        wrapper: ({ children }) => (
          <Wrapper initialEntries={initialEntries}>{children}</Wrapper>
        ),
      }
    );

    const { tags } = result.current.getParams({ convert: true });
    expect(tags).toEqual(["uno", "dos", "tres"]);
  });

  it("Should return tags as string in CSV mode when using convert:false", () => {
    const initialEntries = ["/?tags=uno,dos,tres"];
    const { result } = renderHook(
      () =>
        useMagicSearchParams({
          ...paramsUsers,
          arraySerialization: "csv",
        }),
      {
        wrapper: ({ children }) => (
          <Wrapper initialEntries={initialEntries}>{children}</Wrapper>
        ),
      }
    );

    const { tags } = result.current.getParams({ convert: false });
    // For CSV, it is expected to return the string as it comes in the URL
    expect(tags).toEqual("tags=uno,dos,tres");
  });

  it("Should convert tags to array in REPEAT mode when using convert:true", () => {
    // In repeat each tag is sent as a separate parameter
    const initialEntries = ["/?tags=uno&tags=dos&tags=tres"];
    const { result } = renderHook(
      () =>
        useMagicSearchParams({
          ...paramsUsers,
          arraySerialization: "repeat",
        }),
      {
        wrapper: ({ children }) => (
          <Wrapper initialEntries={initialEntries}>{children}</Wrapper>
        ),
      }
    );

    const { tags } = result.current.getParams({ convert: true });
    expect(tags).toEqual(["uno", "dos", "tres"]);
  });

  it("Should return tags in REPEAT mode in raw format when using convert:false", () => {
    // In repeat, although the hook processes the values internally, when not converting the same values are expected
    // (Note: depending on the implementation, the first value could be returned; in this test we assume that getParams uses getAll internally if arrays need to be maintained)
    const initialEntries = ["/?tags=uno&tags=dos&tags=tres"];
    const { result } = renderHook(
      () =>
        useMagicSearchParams({
          ...paramsUsers,
          arraySerialization: "repeat",
        }),
      {
        wrapper: ({ children }) => (
          <Wrapper initialEntries={initialEntries}>{children}</Wrapper>
        ),
      }
    );

    const { tags } = result.current.getParams({ convert: false });
    // Assuming that in repeat mode the concatenated value is returned (as it would be sent to the backend)
    expect(tags).toEqual("tags=uno&tags=dos&tags=tres");
  });

  it("Should convert tags to array in BRACKETS mode when using convert:true", () => {
    // In brackets the URL is expected to contain tags[]=uno&tags[]=dos&tags[]=tres
    const initialEntries = ["/?tags[]=uno&tags[]=dos&tags[]=tres"];
    const { result } = renderHook(
      () =>
        useMagicSearchParams({
          ...paramsUsers,
          arraySerialization: "brackets",
        }),
      {
        wrapper: ({ children }) => (
          <Wrapper initialEntries={initialEntries}>{children}</Wrapper>
        ),
      }
    );

    const { tags } = result.current.getParams({ convert: true });
    expect(tags).toEqual(["uno", "dos", "tres"]);
  });

  it("Should return tags in BRACKETS mode in raw format when using convert:false", () => {
    const initialEntries = ["/?tags[]=uno&tags[]=dos&tags[]=tres"];
    const { result } = renderHook(
      () =>
        useMagicSearchParams({
          ...paramsUsers,
          arraySerialization: "brackets",
        }),
      {
        wrapper: ({ children }) => (
          <Wrapper initialEntries={initialEntries}>{children}</Wrapper>
        ),
      }
    );

    const { tags } = result.current.getParams({ convert: false });
    // For brackets, it is expected to retain the bracket notation in the key,
    // probably as a processed result of getParamsObj.
    // Adjust according to the implementation; here it is expected to return a concatenated string.
    expect(tags).toEqual("tags[]=uno&tags[]=dos&tags[]=tres");
  });
});
describe("Array combination test in updateParams", () => {
  it("Allows combining current tags with new ones manually and without duplicates", () => {
    const { result } = renderHook(
      () =>
        useMagicSearchParams({
          ...paramsUsers,
          defaultParams: paramsUsers.mandatory,
          arraySerialization: "repeat",
        }),
      { wrapper: Wrapper }
    );

    // Assuming the initial tags are ['uno', 'dos', 'tres']
    const initialParams = result.current.getParams({ convert: true });
    expect(initialParams.tags).toEqual(["uno", "dos", "tres"]);

    // The developer decides to combine keeping the current ones and adding new ones without duplicates
    const newTags = ["react", "dos", "nuevo"];
    const combinedTags = [
      ...initialParams.tags,
      // @ts-ignore
      ...newTags.filter((tag) => !initialParams.tags.includes(tag)),
    ];

    act(() => {
      // @ts-ignore
      result.current.updateParams({ newParams: { tags: combinedTags } });
    });

    const updatedParams = result.current.getParams({ convert: true });
    expect(updatedParams.tags).toEqual([
      "uno",
      "dos",
      "tres",
      "react",
      "nuevo",
    ]);
  });
});
