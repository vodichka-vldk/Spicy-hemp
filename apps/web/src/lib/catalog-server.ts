import { mergeCatalog, products, publicProducts, type Product } from "./shop";
import { store } from "./store";

/** Built-in products + the admin's catalogue entries. Falls back to the built-in list if the store is unreachable. */
export async function loadProducts(): Promise<Product[]> {
  try {
    return mergeCatalog(await store().listCatalog());
  } catch (err) {
    console.error("catalogue unavailable, using built-in products", err);
    return products;
  }
}

export async function loadPublicProducts(): Promise<Product[]> {
  return publicProducts(await loadProducts());
}
