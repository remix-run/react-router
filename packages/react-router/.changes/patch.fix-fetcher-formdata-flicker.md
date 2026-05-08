Fix a race condition in fetcher state machine where `formData` briefly became `undefined` before new `loaderData` was available, causing a UI flicker in optimistic update patterns (#14506)
