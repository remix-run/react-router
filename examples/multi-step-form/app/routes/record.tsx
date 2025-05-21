import { Link, type LoaderFunctionArgs } from "react-router";
import {
  getClientbyMobileNumber,
  getEmployee,
  getService,
} from "~/utils/functions";
import type { Route } from "./+types/record";
import { FaLongArrowAltLeft } from "react-icons/fa";
export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const searchParams = new URLSearchParams(url.search);
  const { mobile_num, amount_charged, service_id, employee_id } =
    getSearchParams(searchParams);

  const client = getClientbyMobileNumber(mobile_num);
  if (!client) {
    throw new Error(`No client found with mobile number: ${mobile_num}`);
  }

  const service = getService(service_id);
  if (!service) {
    throw new Error(`No service found with id: ${service}`);
  }

  const employee = getEmployee(employee_id);
  if (!employee) {
    throw new Error(`No employee found with id: ${employee}`);
  }

  return { service, client, employee, amount_charged };
}

function getSearchParams(searchParams: URLSearchParams) {
  const mobile_num = searchParams.get("mobile_num");
  const service_id = searchParams.get("service");
  const amount_charged = searchParams.get("amount_charged");
  const employee_id = searchParams.get("employee");

  if (!mobile_num || !service_id || !amount_charged || !employee_id) {
    throw new Error("Search Params missing");
  }
  return { mobile_num, service_id, amount_charged, employee_id };
}

export default function Record({ loaderData }: Route.ComponentProps) {
  const { amount_charged, service, client, employee } = loaderData;

  return (
    <div className="flex flex-col justify-center items-center min-h-screen bg-gray-100 relative">
      <Link
        to="/"
        className="bg-green-400 text-white font-semibold py-2 px-4 absolute top-20 left-10 rounded-lg hover:bg-green-500 flex items-center justify-around gap-2"
      >
        <FaLongArrowAltLeft className="" />
        Go Back to Home
      </Link>
      <div className="bg-white mt-14 p-8 rounded-lg shadow-md w-1/2 grid grid-cols-2 gap-4">
        <h1 className="text-2xl font-bold text-gray-800 mb-6 col-span-2 ">
          Record Details
        </h1>
        <h3 className="font-medium text-gray-700">Client Name</h3>
        <h3 className="text-gray-600">
          {client.first_name} {client.last_name}
        </h3>
        <h3 className="font-medium text-gray-700">Service</h3>
        <h3 className="text-gray-600">{service.name}</h3>

        <h3 className="font-medium text-gray-700">Employee Name</h3>
        <h3 className="text-gray-600">
          {employee.first_name} {employee.last_name}
        </h3>

        <h3 className="font-medium text-gray-700">Amount Charged</h3>
        <h3 className="text-gray-600">{amount_charged}</h3>
      </div>
    </div>
  );
}
