Fix route ranking/scoring bug with dynamic parameters containing static extension suffixes (i.e., `/:name.xml`)

- These were not being detected as dynamic param segments and instead got incorrectly scored higher as a static segment
- This meant they could potentially tie truly static routes like `/sitemap.xml` and outrank them based on definition order
- These are now correctly identified as dynamic parameter segments and scored correctly
