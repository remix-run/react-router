import React, { useEffect } from "react";

import { paramsUsers, type TagsUserProps } from "./constants/defaultParamsPage";
import { DarkSvg } from "./components/ui/svg/DarkSvg";
import { LightSvg } from "./components/ui/svg/LightSvg";
import { useHandleTheme } from "./hooks/useHandleTheme";
import { useMagicSearchParams } from 'react-magic-search-params'

import { debounce } from 'es-toolkit'

export default function App() {

  /**
   * Initializes the hook with the mandatory and optional parameters defined in paramsUsers.
   * - defaultParams: Sets the default mandatory parameters when loading the component.
   * - forceParams: Forces the value of page_size to 10, preventing the user from modifying it.
   * - omitParamsByValues: Omits values like 'all' and 'default' from the URL.
   */
  const { searchParams, getParams, updateParams, clearParams, getParam, onChange } =
    useMagicSearchParams({
      ...paramsUsers,
      defaultParams: paramsUsers.mandatory,
      forceParams: { page_size: 10 },
      arraySerialization: "csv", // tags=tag1,tag2,tag3
      omitParamsByValues: ["all", "default"], // when 'all' or 'default' is sent in the URL, they will be omitted
    });
  const { onChangeTheme, origin, theme } = useHandleTheme();

  const { page, search, order, only_is_active, tags } = getParams({
    convert: true,
  });
  // In cases where a series of asynchronous or synchronous actions are required when a parameter changes
  useEffect(() => {
    const sub1 = 'search'
    // const sub2 = 'tags'
    function fetchData() {
      // it can be an API call or any other asynchronous operation
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve('some data')
        }, 2000)
      })

    }
    function showData(data) {
      console.log('showData', data)
    }
    function message() {

      console.log('message')
      alert(`parameter change ${sub1} detected`)
    }

    onChange(sub1, [
      async () => {
        const data = await fetchData();
        showData(data)
      },
      message
    ])
    // onChange(sub2, [])

  }, [onChange])


  const { tags: tagsWithoutConvert } = getParams({ convert: true });

  const tagsArray = getParam("tags", { convert: false });
  console.log(tagsArray); // react,node,javascript
  /**
   * Handles the change in the search field.
   * - Updates the 'search' parameter and resets to page 1.
   */
  const TIEMPO_RETRASO = 500;


  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const searchTerm = e.target.value.trim();
    updateParams({ newParams: { search: searchTerm, page: 1 } });
  }
  const searchDebounce = debounce(handleSearchChange, TIEMPO_RETRASO)



  /**
   * Handles the change in the sorting select.
   * - Updates the 'order' parameter while keeping other parameters intact.
   */
  const handleOrderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedOrder = e.target.value;
    updateParams({ newParams: { order: selectedOrder } });
  };

  /**
   * handleTagToggle
   * INPUT PARAMETERS:
   * case 1 (array of tags): [1,2,3,4] result: tags=1,2,3,4, if another array of tags with repeated values is passed, unique values are maintained
   * Useful for applying a set of tags at once
   *
   * case 2 (a single tag): 1 result: tags=1, if an existing tag is passed, it is removed from the list of tags
   * Useful for toggling tags by pressing button by button
   */
  const availableTags = ["react", "node", "typescript", "javascript"];
  const handleTagToggle = (tag: TagsUserProps) => {

    const tagsFiltered = [...tags];
    if (tagsFiltered.includes(tag)) {
      const index = tagsFiltered.indexOf(tag);
      tagsFiltered.splice(index, 1);
    } else {
      tagsFiltered.push(tag);
    }
    updateParams({ newParams: { tags: [...tagsFiltered] } });
  };
  console.log({ searchTags: searchParams.getAll("tags") }); // tags=react,node,javascript
  /**
   * Resets all parameters to their default values.
   */

  const handleClear = () => {
    // The values of the mandatory parameters that were modified are maintained, otherwise they are reset to the default values
    clearParams({ keepMandatoryParams: false });
  };

  const converStringBoolean = (value: string | boolean) => {
    // Since a string is obtained from the URL, it is converted to boolean (ensures the change if convert: false was chosen in getParams)
    if (typeof value === "boolean") return !value;
    if (value === "true") {
      return true;
    } else if (value === "false") {
      return false;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center p-6  bg-gradient-to-r dark:from-blue-700 dark:via-blue-800 dark:to-blue-900 dark:text-white ">
       <LightSvg width={24} height={24} />
      <div className="absolute top-0 right-0 p-4">
        <button
          className="p-4 bg-slate-200 rounded-sm hover:bg-slate-300"
          onClick={onChangeTheme}
        >
          {theme === "light" ? (
            <LightSvg width={24} height={24} />
          ) : (
            <DarkSvg width={24} height={24} />
          )}
        </button>
      </div>
      <div className="w-full max-w-4xl bg-white shadow-lg rounded-lg p-8 mb-6 dark:bg-transparent relative overflow-hidden z-50">
        {theme === "dark" && (
          <div className="absolute top-0 left-0 right-0 bottom-0 filter blur-2xl hover:blur-3xl bg-black opacity-40 -z-10 "></div>
        )}
        <h1 className="text-3xl font-bold mb-6 text-center">
          User Management
        </h1>

        {/* Search Section */}
        <div className="mb-6">
          <label
            htmlFor="search"
            className="block text-sm font-medium text-gray-700 mb-1 dark:text-white"
          >
            Search Users:
          </label>
          <input
            type="text"
            id="search"
            onChange={searchDebounce}
            placeholder="Enter first or last name..."
            className="w-full border border-gray-300 rounded-md p-3 focus:ring-blue-500 focus:border-blue-500"
            /* Note: normally a debounce will be used so this input should be uncontrolled (defaultValue) */
            defaultValue={search}
          />
        </div>

        {/* Sorting Section */}
        <div className="mb-6">
          <label
            htmlFor="order"
            className="block text-sm font-medium text-gray-700 mb-1 dark:text-white"
          >
            Sort By:
          </label>
          <select
            id="order"
            value={order}
            onChange={handleOrderChange}
            defaultValue={order}
            className="w-full border border-gray-300 rounded-md p-3 focus:ring-blue-500 focus:border-blue-500 dark:text-white "
          >
            <option value="all" className="dark:bg-sky-950">None(all)</option>
            <option value="asc" className="dark:bg-sky-950">Ascending(asc)</option>
            <option value="desc" className="dark:bg-sky-950">Descending(desc)</option>
          </select>
        </div>

        <div className="mb-6">
          <label
            htmlFor="only_is_active"
            className="flex items-center space-x-2 cursor-pointer"
          >
            <input
              type="checkbox"
              id="only_is_active"
              onChange={() =>
                updateParams({
                  newParams: {
                    only_is_active: converStringBoolean(only_is_active),
                  },
                })
              }
              checked={converStringBoolean(only_is_active)}
              className="text-blue-500 rounded"
            />
            <span className="text-sm text-gray-700 dark:text-white">
              Show only active users
            </span>
          </label>
        </div>

        {/* Tag Buttons */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">Select Tags:</h3>
          <div className="flex flex-wrap gap-2">
            {availableTags.map((tag: TagsUserProps) => {
              
              const isActive = Array.isArray(tags) && tags.includes(tag);
              return (
                <button
                  key={tag}
                  onClick={() => handleTagToggle(tag)}
                  className={`px-4 py-2 rounded-md border ${
                    isActive
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200 text-gray-700"
                  }`}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        </div>

        {/* Current Parameters Section */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">Current Parameters:</h3>
          <div className="bg-gray-50 p-5 rounded-md shadow-inner dark:bg-zinc-900">
            <p>
              <strong>Page:</strong> {page}
            </p>
            <p>
              <strong>Page Size:</strong> {10}
            </p>
            <p>
              <strong>Only Active:</strong>{" "}
              {converStringBoolean(only_is_active) ? "Yes" : "No"}
            </p>
            <p>
              <strong>Tags:</strong> {JSON.stringify(tags)}
            </p>
            <hr className="mt-2" />
            <small className="bg-yellow-300 rounded-sm p-0.5 dark:bg-cyan-600">
              Note: This is how they should be sent to the backend
            </small>
            <p>
              <strong>Tags without conversion:</strong>{" "}
              {JSON.stringify(tagsWithoutConvert)}
            </p>
            <p>
              <strong>Order:</strong> {order || "None"}
            </p>
            <p>
              <strong>Search:</strong> {search || "None"}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-4 justify-center">
          <button
            onClick={() => updateParams({ newParams: { page: page + 1 } })}
            className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition duration-200"
          >
            Next Page
          </button>
          <button
            onClick={handleClear}
            className="bg-red-600 text-white px-6 py-3 rounded-md hover:bg-red-700 transition duration-200"
          >
            Clear Filters
          </button>
        </div>
        <div className="mt-6 bg-gray-50 p-5 rounded-md shadow-inner">
          <p className="text-sm text-gray-600">
            Try refreshing the page and see how the parameters are maintained or cleared based on the actions taken.
          </p>
        </div>
      </div>
    </div>
  );
}
