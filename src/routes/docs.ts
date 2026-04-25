import { Hono } from "hono";
export const docsRoutes = new Hono();

docsRoutes.get("/", (c) => {
  return c.html(`
    <html>
      <body>
        <script 
          id="api-reference"
          data-url="/openapi.yml">
        </script>
        <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
      </body>
    </html>
  `);
});