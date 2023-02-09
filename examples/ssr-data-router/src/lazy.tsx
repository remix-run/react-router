import React from "react";
import type {
  ActionFunction,
  ShouldRevalidateFunction,
} from "react-router-dom";
import { Form, useLoaderData } from "react-router-dom";

interface LazyLoaderData {
  date: string;
  submissionCount: number;
}

let submissionCount = 0;

export const loader = async (): Promise<LazyLoaderData> => {
  await new Promise((r) => setTimeout(r, 500));
  return {
    date: new Date().toISOString(),
    submissionCount,
  };
};

export const action: ActionFunction = async ({ request }) => {
  await new Promise((r) => setTimeout(r, 500));

  let body = await request.formData();
  if (body.get("error")) {
    throw new Error("Form action error");
  }

  submissionCount++;
  return submissionCount;
};

function ErrorBoundary() {
  return (
    <>
      <h2>Lazy error boundary</h2>
      <pre>Something went wrong</pre>
    </>
  );
}

export const errorElement = <ErrorBoundary />;

export const shouldRevalidate: ShouldRevalidateFunction = (args) => {
  return Boolean(args.formAction);
};

function LazyPage() {
  let data = useLoaderData() as LazyLoaderData;

  return (
    <>
      <h2>Lazy</h2>
      <p>Date from loader: {data.date}</p>
      <p>Form submission count: {data.submissionCount}</p>
      <Form method="post">
        <div style={{ display: "flex", gap: 12 }}>
          <button>Submit form</button>
          <button name="error" value="true">
            Throw an error
          </button>
        </div>
      </Form>
    </>
  );
}

export const element = <LazyPage />;
