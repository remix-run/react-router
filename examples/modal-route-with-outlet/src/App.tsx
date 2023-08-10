import * as React from "react";
import {
  Outlet,
  Link,
  useNavigate,
  useParams,
  RouterProvider,
  createBrowserRouter,
} from "react-router-dom";
import { Dialog } from "@reach/dialog";
import "@reach/dialog/styles.css";

import { IMAGES, getImageById } from "./images";

const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      {
        path: "/",
        Component: Home,
      },
      {
        path: "gallery",
        Component: Gallery,
        children: [
          {
            path: "img/:id",
            Component: ImageView,
          },
        ],
      },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}

export function Layout() {
  return (
    <div>
      <h1>Outlet Modal Example</h1>
      <p>
        This is a modal example using createBrowserRouter that drives modal
        displays through URL segments. The modal is a child route of its parent
        and renders in the Outlet.
      </p>
      <div>
        <nav>
          <ul>
            <li>
              <Link to="/">Home</Link>
            </li>
            <li>
              <Link to="/gallery">Gallery</Link>
            </li>
          </ul>
        </nav>
        <hr />
      </div>
      <Outlet />
    </div>
  );
}

export function Home() {
  return (
    <div>
      <h2>Home</h2>
      <p>
        Click over to the <Link to="/gallery">Gallery</Link> route to see the
        modal in action
      </p>
      <Outlet />
    </div>
  );
}

export function Gallery() {
  return (
    <div style={{ padding: "0 24px" }}>
      <h2>Gallery</h2>
      <p>
        Click on an image, you'll notice that you still see this route behind
        the modal. The URL will also change as its a child route of{" "}
        <pre style={{ display: "inline" }}>/gallery</pre>{" "}
      </p>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "24px",
        }}
      >
        {IMAGES.map((image) => (
          <Link key={image.id} to={`img/${image.id}`}>
            <img
              width={200}
              height={200}
              style={{
                width: "100%",
                aspectRatio: "1 / 1",
                height: "auto",
                borderRadius: "8px",
              }}
              src={image.src}
              alt={image.title}
            />
          </Link>
        ))}
        <Outlet />
      </div>
    </div>
  );
}

export function ImageView() {
  let navigate = useNavigate();
  let { id } = useParams<"id">();
  let image = getImageById(Number(id));
  let buttonRef = React.useRef<HTMLButtonElement>(null);

  function onDismiss() {
    navigate(-1);
  }

  if (!image) {
    throw new Error(`No image found with id: ${id}`);
  }

  return (
    <Dialog
      aria-labelledby="label"
      onDismiss={onDismiss}
      initialFocusRef={buttonRef}
    >
      <div
        style={{
          display: "grid",
          justifyContent: "center",
          padding: "8px 8px",
        }}
      >
        <h1 id="label" style={{ margin: 0 }}>
          {image.title}
        </h1>
        <img
          style={{
            margin: "16px 0",
            borderRadius: "8px",
            width: "100%",
            height: "auto",
          }}
          width={400}
          height={400}
          src={image.src}
          alt=""
        />
        <button
          style={{ display: "block" }}
          ref={buttonRef}
          onClick={onDismiss}
        >
          Close
        </button>
      </div>
    </Dialog>
  );
}
