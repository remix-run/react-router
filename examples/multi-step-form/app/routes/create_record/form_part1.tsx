import {
  Form, replace, useActionData,
  useOutletContext,
  type ActionFunctionArgs
} from "react-router";
import type { FormType } from "~/utils/types";
import { getClientbyMobileNumber } from "~/utils/functions";

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const mobile_num = formData.get("mobile_num")?.toString() || "";
  if (!mobile_num) {
    return { msg: "No mobile number received" };
  }

  // Fetch the client
  const client = await getClientbyMobileNumber(mobile_num);
  if (!client) {
    return { error: `No client with mobile number: ${mobile_num} found` };
  }

  const redirectUrl = `form_part2?mobile_num=${encodeURIComponent(mobile_num)}`;
  throw replace(redirectUrl);
}

export default function Form_Part1() {
  const actionData = useActionData<{ error: string }>();
  const { formData, setFormData } = useOutletContext<{
    formData: FormType;
    setFormData: React.Dispatch<React.SetStateAction<FormType>>;
  }>();

  return (
    <div className="flex justify-center items-center min-h-screen">
      <Form
        method="post"
        className="bg-white p-6 rounded shadow-md w-80"
      >
        <label
          htmlFor="mobile_num"
          className="block text-gray-700 text-sm font-bold mb-2"
        >
          Enter Client Mobile Number
        </label>
        <input
          type="text"
          id="mobile_num"
          name="mobile_num"
          pattern="[0-9]*"
          defaultValue={formData.mobile_num}
          onChange={(e) =>
            setFormData((prev) => ({
              ...prev,
              mobile_num: e.target.value,
            }))
          }
          className="w-full px-3 py-2 border border-gray-300 rounded-md mb-4"
          required
        />
        {actionData ? (
          <div className="text-red-700">{actionData.error}</div>
        ) : undefined}
        <button
          type="submit"
          className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Next
        </button>
      </Form>
    </div>
  );
}
