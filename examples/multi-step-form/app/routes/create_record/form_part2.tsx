import {
  Form, replace,
  useActionData,
  useNavigate,
  useOutletContext,
  useSubmit,
  type LoaderFunctionArgs
} from "react-router";
import {
  getAllEmployees,
  getClientbyMobileNumber,
  getAllServices
} from "~/utils/functions";
import type { Route } from "./+types/form_part2";
import type { FormType } from "~/utils/types";

export async function loader({ request }: LoaderFunctionArgs) {
  const mobile_num = new URL(request.url).searchParams.get("mobile_num");
  if (!mobile_num) {
    throw replace(`/create_record`);
  }
  const client = getClientbyMobileNumber(mobile_num);
  if (!client) {
    throw replace(`/create_record`);
  }
  const services = await getAllServices();
  const employees = await getAllEmployees();
  return { client, services, employees };
}

export async function action({ request }: LoaderFunctionArgs) {
  const data = await request.json();
  const { mobile_num, service, amount_charged, employee } = data;

  //perform validation. Usually done through a libarary like zod or yup

  if (!service || !amount_charged || !employee || !mobile_num) {
    return { error: "All fields are required" };
  }

  //include other validations as needed. important to redo all validations done in previous steps before creating a record in DB

  //create the record

  const params = new URLSearchParams({
    mobile_num,
    service,
    amount_charged: amount_charged.toString(),
    employee,
  });
  const redirect_url = `/record?${params.toString()}`;

  throw replace(redirect_url);
}

export default function FormPart2({ loaderData }: Route.ComponentProps) {
  const { client, services, employees } = loaderData;
  const { formData, setFormData } = useOutletContext<{
    formData: FormType;
    setFormData: React.Dispatch<React.SetStateAction<FormType>>;
  }>();
  const actionData = useActionData<{ error: string }>();
  const navigate = useNavigate();
  const submit = useSubmit();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    submit(formData, { method: "post", encType: "application/json" });
  };

  return (
    <Form
      method="post"
      onSubmit={handleSubmit}
      className="bg-white p-6 rounded shadow-md w-80 text-black"
    >
      <div className="block text-gray-700 text-sm font-bold mb-2">
        Client Name:{" "}
        <span className="font-semibold">
          {`${client.first_name} ${client.last_name}`}
        </span>
      </div>
      <div className="block text-gray-700 text-sm font-bold mb-2">
        Mobile Number:{" "}
        <span className="font-semibold">{client.mobile_number}</span>
      </div>

      <label
        htmlFor="service"
        className="block text-gray-700 text-sm font-bold mb-2"
      >
        Select Service
      </label>
      <select
        name="service"
        id="service"
        required
        className="w-full px-3 py-2 border border-gray-300 rounded-md mb-4"
        value={formData.service}
        onChange={(e) =>
          setFormData((prev) => ({
            ...prev,
            service: e.target.value,
          }))
        }
      >
        <option value="">-- Select a Service --</option>
        {services.map((service) => (
          <option key={service.id} value={service.id}>
            {service.name}
          </option>
        ))}
      </select>

      <label
        htmlFor="amount_charged"
        className="block text-gray-700 text-sm font-bold mb-2"
      >
        Amount Charged
      </label>
      <input
        type="number"
        name="amount_charged"
        id="amount_charged"
        className="w-full px-3 py-2 border border-gray-300 rounded-md mb-4"
        min={0}
        required
        value={formData.amount_charged}
        onChange={(e) =>
          setFormData((prev) => ({
            ...prev,
            amount_charged: Number(e.target.value),
          }))
        }
      />

      <label
        htmlFor="employee"
        className="block text-gray-700 text-sm font-bold mb-2"
      >
        Select Employee
      </label>
      <select
        name="employee"
        id="employee"
        required
        className="w-full px-3 py-2 border border-gray-300 rounded-md mb-4"
        value={formData.employee}
        onChange={(e) =>
          setFormData((prev) => ({
            ...prev,
            employee: e.target.value,
          }))
        }
      >
        <option value="">-- Select an Employee --</option>
        {employees.map((employee) => (
          <option key={employee.id} value={employee.id}>
            {employee.first_name} {employee.last_name}
          </option>
        ))}
      </select>
      {actionData?.error && (
        <div className="text-red-700">{actionData.error}</div>
      )}

      <div className="flex justify-between items-center mt-6">
        <button
          type="button"
          onClick={() => navigate(`/create_record`)}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Previous
        </button>
        <button
          type="submit"
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
    </Form>
  );
}
