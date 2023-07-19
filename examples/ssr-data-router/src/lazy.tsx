import { useLoaderData } from "react-router-dom";

interface LazyLoaderData {
  date: string;
}

export const loader = async (): Promise<LazyLoaderData> => {
  await new Promise((r) => setTimeout(r, 500));
  return {
    date: new Date().toISOString(),
  };
};

function LazyPage() {
  let data = useLoaderData() as LazyLoaderData;

  return (
    <>
      <h2>Lazy Route</h2>
      <p>Date from loader: {data.date}</p>
    </>
  );
}

export const element = <LazyPage />;
