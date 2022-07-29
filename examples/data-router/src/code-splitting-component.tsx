import { useLoaderData } from "react-router-dom";

export default function CodeSplitting() {
  let data = useLoaderData();
  return <p>Code Splitting Loader Data Value: {data.value}</p>;
}
