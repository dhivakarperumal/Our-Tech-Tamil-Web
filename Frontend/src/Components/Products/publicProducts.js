import api from "../../api";

const PRODUCTS_PER_PAGE = 100;

export async function fetchAllPublicProducts() {
  const firstResponse = await api.get("/products/public", {
    params: { page: 1, limit: PRODUCTS_PER_PAGE },
  });
  const firstPage = firstResponse.data;
  const products = Array.isArray(firstPage?.products) ? firstPage.products : [];
  const totalPages = Math.max(1, Number(firstPage?.pagination?.totalPages) || 1);

  const remainingPages = await Promise.all(
    Array.from({ length: totalPages - 1 }, (_, index) =>
      api.get("/products/public", {
        params: { page: index + 2, limit: PRODUCTS_PER_PAGE },
      }),
    ),
  );

  return products.concat(
    ...remainingPages.map((response) =>
      Array.isArray(response.data?.products) ? response.data.products : [],
    ),
  );
}
