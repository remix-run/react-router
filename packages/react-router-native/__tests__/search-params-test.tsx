import * as React from "react";
import { View, Text, TextInput } from "react-native";
import {
  NativeRouter,
  Routes,
  Route,
  useSearchParams
} from "react-router-native";
import * as TestRenderer from "react-test-renderer";

describe("useSearchParams", () => {
  function SearchForm({
    children
  }: {
    children: React.ReactNode;
    onSubmit?: any;
  }) {
    return <View>{children}</View>;
  }

  describe("get and set", () => {
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

    it("reads and writes the search string", () => {
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
  });

  describe("update function", () => {
    function ParamsPage() {
      let [searchParams, setSearchParams] = useSearchParams();

      const setA = React.useCallback(
        a => {
          setSearchParams(params => params.set("a", a));
        },
        [setSearchParams]
      );

      const setB = React.useCallback(
        b => {
          setSearchParams(params => ({ a: params.get("a"), b }));
        },
        [setSearchParams]
      );

      return (
        <View>
          <Text>
            The current params are "{searchParams.get("a")}" and "
            {searchParams.get("b")}".
          </Text>

          <TextInput value={searchParams.get("a")} onChangeText={setA} />
          <TextInput value={searchParams.get("b")} onChangeText={setB} />
        </View>
      );
    }

    it("writes search string with correctly updated state", () => {
      let renderer: TestRenderer.ReactTestRenderer;
      TestRenderer.act(() => {
        renderer = TestRenderer.create(
          <NativeRouter initialEntries={["/params?a=Simon&b=Garfunkel"]}>
            <Routes>
              <Route path="params" element={<ParamsPage />} />
            </Routes>
          </NativeRouter>
        );
      });

      expect(renderer.toJSON()).toMatchSnapshot();

      let [aInput, bInput] = renderer.root.findAllByType(TextInput);

      TestRenderer.act(() => {
        aInput.props.onChangeText("Bert");
        bInput.props.onChangeText("Ernie");
      });

      expect(renderer.toJSON()).toMatchSnapshot();
    });
  });
});
