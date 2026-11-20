"use client";

import { useOptimistic } from "react";
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
    setOptimisticLiked((liked) => !liked);
    await toggleLikedAction();
  };

  return (
    <form action={hydrated ? toggleLikedActionOptimistic : toggleLikedAction}>
      <button type="submit" className="btn">
        {optimisticLiked ? "Unlike" : "Like"}
      </button>
    </form>
  );
}
