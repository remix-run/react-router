import * as React from "react";
import {
  Routes,
  Route,
  Outlet,
  Link,
  useLocation,
  useNavigate,
  useParams
} from "react-router-dom";

export default function App() {
  let location = useLocation();

  // This piece of state is set when one of the
  // gallery links is clicked. The `image` state
  // is the location that we were at when one of
  // the gallery links was clicked. If it's there,
  // use it as the location for the <Routes> so
  // we show the gallery in the background, behind
  // the modal.
  let state = location.state as { image?: Location };
  let image = state?.image;

  return (
    <div>
      <h1>Welcome to the app!</h1>
      <Routes location={image || location}>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          {/* Show the modal when a image page is set */}
          {image && <Route path="/img/:id" element={<Modal />} />}
          <Route path="gallery" element={<Gallery />} />
          <Route path="/img/:id" element={<ImageView />} />
          <Route path="*" element={<NoMatch />} />
        </Route>
      </Routes>
    </div>
  );
}

function Layout() {
  return (
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

      <Outlet />
    </div>
  );
}

function Home() {
  return (
    <div>
      <h2>Home</h2>

      <h3>Featured Images</h3>
      <ul>
        <li>
          <Link to="/img/1">Image 1</Link>
        </li>
        <li>
          <Link to="/img/2">Image 2</Link>
        </li>
      </ul>
    </div>
  );
}

let IMAGES = [
  {
    id: 0,
    title: "Image 0",
    src: "https://images.unsplash.com/photo-1631016800696-5ea8801b3c2a?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&h=400&ixid=MnwxfDB8MXxyYW5kb218MHx8fHx8fHx8MTYzMzM2Mzg4Ng&ixlib=rb-1.2.1&q=80&w=400"
  },
  {
    id: 1,
    title: "Image 1",
    src: "https://images.unsplash.com/photo-1632900200771-6e05b1cdfbfd?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&h=400&ixid=MnwxfDB8MXxyYW5kb218MHx8fHx8fHx8MTYzMzM2NDAzMw&ixlib=rb-1.2.1&q=80&w=400"
  },
  {
    id: 2,
    title: "Image 2",
    src: "https://images.unsplash.com/photo-1631936156950-cceaff421624?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&h=400&ixid=MnwxfDB8MXxyYW5kb218MHx8fHx8fHx8MTYzMzM2NDA3Nw&ixlib=rb-1.2.1&q=80&w=400"
  },
  {
    id: 3,
    title: "Image 3",
    src: "https://images.unsplash.com/photo-1631116618155-6074e787a30b?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&h=400&ixid=MnwxfDB8MXxyYW5kb218MHx8fHx8fHx8MTYzMzM2NDEwMg&ixlib=rb-1.2.1&q=80&w=400"
  }
];

function Gallery() {
  let location = useLocation();

  return (
    <div style={{ padding: "0 24px" }}>
      <h2>Gallery</h2>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "24px"
        }}
      >
        {IMAGES.map(image => (
          <Link
            key={image.id}
            to={`/img/${image.id}`}
            // This is the trick! This link sets
            // the `background` in location state.
            state={{ image: location }}
          >
            <img
              width={200}
              height={200}
              style={{
                width: "100%",
                aspectRatio: "1 / 1",
                height: "auto",
                borderRadius: "8px"
              }}
              src={image.src}
              alt=""
            />
          </Link>
        ))}
      </div>
    </div>
  );
}

function ImageView() {
  let { id } = useParams<"id">();
  let image = IMAGES[Number(id)];

  if (!image) return <div>Image not found</div>;

  return (
    <div>
      <h1>{image.title}</h1>
      <img width={400} height={400} src={image.src} alt="" />
    </div>
  );
}

function Modal() {
  let navigate = useNavigate();
  let { id } = useParams<"id">();
  let image = IMAGES[Number(id)];
  let ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (!ref.current || ref.current.contains(event.target as Node)) {
        return;
      }

      navigate(-1);
    }

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [navigate]);

  if (!image) return null;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: "rgba(0, 0, 0, 0.15)",
        display: "grid",
        placeItems: "center"
      }}
    >
      <div
        ref={ref}
        style={{
          background: "#fff",
          padding: "24px",
          borderRadius: "8px"
        }}
      >
        <h1>{image.title}</h1>
        <img width={400} height={400} src={image.src} alt="" />
      </div>
    </div>
  );
}

function NoMatch() {
  return (
    <div>
      <h2>Nothing to see here!</h2>
      <p>
        <Link to="/">Go to the home page</Link>
      </p>
    </div>
  );
}
