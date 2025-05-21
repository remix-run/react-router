import { useState } from "react";
import { Outlet } from "react-router";

export default function CreateSaleRecord() {
  const [formData, setFormData] = useState({
    amount_charged: 0,
    mobile_num: "",
    service: "",
    employee: "",
  });

  return (
    <div className="bg-white text-black flex flex-col items-center justify-center h-screen">
      <Outlet context={{ formData, setFormData }} />
    </div>
  );
}
