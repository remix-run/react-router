import * as React from "react";
import { View, Text, TextInput } from "react-native";
import {
  NativeRouter,
  Routes,
  Route,
  useSearchParams,
} from "react-router-native";
import * as TestRenderer from "react-test-renderer";

describe("useSearchParams", () => {
  function SearchForm({
    children,
  }: {
    children: React.ReactNode;
    onSubmit?: any;
  }) {
    return <View>{children}</View>;
  }

  it("reads and writes the search string", () => {
    function SearchPage() {
      let [searchParams, setSearchParams] = useSearchParams({ q: "" });
      let [query, setQuery] = React.useState(searchParams.get("q")!);

      function handleSubmit() {
        setSearchParams({ q: query });
      }

      return (
        <View>
          <Text>The current query is "{searchParams.get("q")}".</Text>

          <SearchForm onSubmit={handleSubmit}>
            <TextInput value={query} onChangeText={setQuery} />
          </SearchForm>
        </View>
      );
    }

    let renderer: TestRenderer.ReactTestRenderer;
    TestRenderer.act(() => {
      renderer = TestRenderer.create(
        <NativeRouter initialEntries={["/search?q=Michael+Jackson"]}>
          <Routes>
            <Route path="search" element={<SearchPage />} />
          </Routes>
        </NativeRouter>
      );
    });

    expect(renderer.toJSON()).toMatchSnapshot();

    let textInput = renderer.root.findByType(TextInput);

    TestRenderer.act(() => {
      textInput.props.onChangeText("Ryan Florence");
    });

    let searchForm = renderer.root.findByType(SearchForm);

    TestRenderer.act(() => {
      searchForm.props.onSubmit();
    });

    expect(renderer.toJSON()).toMatchSnapshot();
  });

  it("reads and writes the search string (functional update)", () => {
    function SearchPage() {
      let [searchParams, setSearchParams] = useSearchParams({ q: "" });
      let [query, setQuery] = React.useState(searchParams.get("q")!);

      function handleSubmit() {
        setSearchParams((cur) => {
          cur.set("q", `${cur.get("q")} - appended`);
          cur.set("new", "Ryan Florence");
          return cur;
        });
      }

      return (
        <View>
          <Text>The current query is "{searchParams.get("q")}".</Text>
          <Text>The new query is "{searchParams.get("new")}".</Text>

          <SearchForm onSubmit={handleSubmit}>
            <TextInput value={query} onChangeText={setQuery} />
          </SearchForm>
        </View>
      );
    }

    let renderer: TestRenderer.ReactTestRenderer;
    TestRenderer.act(() => {
      renderer = TestRenderer.create(
        <NativeRouter initialEntries={["/search?q=Michael+Jackson"]}>
          <Routes>
            <Route path="search" element={<SearchPage />} />
          </Routes>
        </NativeRouter>
      );
    });

    expect(renderer.toJSON()).toMatchSnapshot();

    let searchForm = renderer.root.findByType(SearchForm);

    TestRenderer.act(() => {
      searchForm.props.onSubmit();
    });

    expect(renderer.toJSON()).toMatchSnapshot();
  });
});
