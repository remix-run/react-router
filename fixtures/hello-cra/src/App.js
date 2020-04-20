import React from 'react';

import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  Outlet,
  useParams
} from 'react-router-dom';

function Home() {
  return (
    <div>
      <h1>Home</h1>
    </div>
  );
}

function About() {
  return (
    <div>
      <h1>About</h1>
    </div>
  );
}

function Courses() {
  return (
    <div>
      <h1>Courses</h1>
      <Outlet />
    </div>
  );
}

function CoursesIndex() {
  return (
    <div>
      <p>Please choose a course:</p>

      <nav>
        <ul>
          <li>
            <Link to="react-fundamentals">React Fundamentals</Link>
          </li>
          <li>
            <Link to="advanced-react">Advanced React</Link>
          </li>
        </ul>
      </nav>
    </div>
  );
}

function ReactFundamentals() {
  return (
    <div>
      <h2>React Fundamentals</h2>

      <Routes>
        <Route path="/" element={<ReactFundamentalsIndex />} />
        <Route path=":courseId" element={<ReactFundamentalsCourse />} />
      </Routes>
    </div>
  );
}

function ReactFundamentalsIndex() {
  return (
    <div>
      <h3>Topics</h3>

      <div>
        <p>Please choose a topic:</p>

        <nav>
          <ul>
            <li>
              <Link to="rendering">Rendering</Link>
            </li>
            <li>
              <Link to="performance">Performance</Link>
            </li>
            <li>
              <Link to="composition">Composition</Link>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  );
}

function ReactFundamentalsCourse() {
  let { courseId } = useParams();

  return (
    <div>
      <p>Learn all about {courseId}</p>
      <p>
        <Link to="..">Back to topics</Link>
      </p>
    </div>
  );
}

function AdvancedReact() {
  return (
    <div>
      <h2>Advanced React</h2>
    </div>
  );
}

function App() {
  return (
    <div>
      <nav>
        <ul>
          <li>
            <Link to="/">Home</Link>
          </li>
          <li>
            <Link to="about">About</Link>
          </li>
          <li>
            <Link to="courses">Courses</Link>
          </li>
        </ul>
      </nav>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="about" element={<About />} />
        <Route path="courses" element={<Courses />}>
          <Route path="/" element={<CoursesIndex />} />
          <Route path="react-fundamentals/*" element={<ReactFundamentals />} />
          <Route path="advanced-react/*" element={<AdvancedReact />} />
        </Route>
      </Routes>
    </div>
  );
}

export default () => (
  <Router>
    <App />
  </Router>
);
