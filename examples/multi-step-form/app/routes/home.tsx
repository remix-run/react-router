import { Link } from "react-router";


export default function Home() {
  return (
    <div className="flex flex-col gap-8 justify-center  items-center h-screen bg-white">
      <h1 className="text-4xl text-black">Multi Part Form</h1>
      <Link
        to="/create_record"
        className="px-6 py-3 bg-blue-600  rounded text-white text-base no-underline"
      >
        Regiser Record
      </Link>
    </div>
  );
}
