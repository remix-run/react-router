import { ToggleLikedForm } from "./form";
import { getLiked } from "./liked";
import { toggleLikedAction } from "./actions";

export function ServerComponent() {
  return (
    <div>
      <h1>Server Component</h1>
      <ToggleLikedForm
        liked={getLiked()}
        toggleLikedAction={toggleLikedAction}
      />
    </div>
  );
}
