Fix a race that could leave `RouterProvider` stuck rendering its hydration fallback when another router subscriber initialized the router before the provider subscribed.
