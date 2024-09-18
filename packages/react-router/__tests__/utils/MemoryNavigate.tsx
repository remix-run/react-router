import type { HTMLFormMethod } from "../../lib/router/utils";
import { joinPaths } from "../../lib/router/utils";
import * as React from "react";
import { UNSAFE_DataRouterContext } from "../../index";

export default function MemoryNavigate({
  to,
  formMethod,
  formData,
  children,
}: {
  to: string;
  formMethod?: HTMLFormMethod;
  formData?: FormData;
  children: React.ReactNode;
}) {
  let dataRouterContext = React.useContext(UNSAFE_DataRouterContext);

  let onClickHandler = React.useCallback(
    async (event: React.MouseEvent) => {
      event.preventDefault();
      if (formMethod && formData) {
        dataRouterContext?.router.navigate(to, { formMethod, formData });
      } else {
        dataRouterContext?.router.navigate(to);
      }
    },
    [dataRouterContext, to, formMethod, formData]
  );

  // Only prepend the basename to the rendered href, send the non-prefixed `to`
  // value into the router since it will prepend the basename
  let basename = dataRouterContext?.basename;
  let href = to;
  if (basename && basename !== "/") {
    href = to === "/" ? basename : joinPaths([basename, to]);
  }

  return formData ? (
    <form onClick={onClickHandler} children={children} />
  ) : (
    <a href={href} onClick={onClickHandler} children={children} />
  );
}
