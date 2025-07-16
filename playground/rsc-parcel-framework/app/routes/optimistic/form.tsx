"use client";

import {
  // @ts-expect-error React types for the repo are set to v18
  useOptimistic,
} from "react";
import { useHydrated } from "remix-utils/use-hydrated";

export function ToggleLikedForm({
  liked,
  toggleLikedAction,
}: {
  liked: boolean;
  toggleLikedAction: () => Promise<void>;
}) {
  const hydrated = useHydrated();

  const [optimisticLiked, setOptimisticLiked] = useOptimistic(liked);
  const toggleLikedActionOptimistic = async () => {
    // @ts-expect-error React types for the repo are set to v18
    setOptimisticLiked((liked) => !liked);
    await toggleLikedAction();
  };

  return (
    // @ts-expect-error React types for the repo are set to v18
    <form action={hydrated ? toggleLikedActionOptimistic : toggleLikedAction}>
      <button type="submit" className="btn">
        {optimisticLiked ? "Unlike" : "Like"}
      </button>
    </form>
  );
}
