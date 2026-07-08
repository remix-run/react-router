Fix route ranking for dynamic parameters with static extension suffixes

- These were not being detected as dynamic param segments and instead got incorrectly scored higher as a static segment
- This meant they could potentially tie truly static routes like `/sitemap.xml` and outrank them based on definition order
- These are now correctly identified as dynamic parameter segments and scored correctly
