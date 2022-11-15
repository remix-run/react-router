import { ActionFunctionArgs, redirect, useRouteError } from "react-router-dom";

import { deleteContact } from '../../api/contacts';
import { getError } from "../Error/utils";

export const errorElement = () => {
  const error = useRouteError();
  
  return <h4>{getError(error)}</h4>
}

export const action = async ({ params }: ActionFunctionArgs) => {
  if (!params?.contactId) {
    throw new Error("Missing contact id from URL")
  }

  if (!await deleteContact(params.contactId)) {
    throw new Error("Error deleting the contact")
  }

  return redirect('/');
}
