import clientData from "~/data/clients.json";
import services from "~/data/services.json";
import employees from "~/data/employees.json";
import record from "~/data/records.json";

const getClientbyMobileNumber = (mobileNumberParam: string) => {
  const client = clientData.find(
    (client) => client.mobile_number === mobileNumberParam
  );
  return client || null;
};

const getAllServices = () => {
  return services;
};

const getService = (id: string) => {
  return services.find((service) => service.id === id);
};

const getAllEmployees = () => {
  return employees;
};

const getEmployee = (id: string) => {
  return employees.find((employee) => employee.id === id);
};

const getServiceRecord = (id: string | number) => {
  return record.find((rec) => rec.id === Number(id));
};

export {
  getEmployee,
  getClientbyMobileNumber,
  getService,
  getAllServices,
  getAllEmployees,
  getServiceRecord,
};
