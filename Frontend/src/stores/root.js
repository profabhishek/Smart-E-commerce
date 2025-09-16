// src/stores/root.js
import { makeAutoObservable } from "mobx";
import { CategoriesStore } from "./categories/CategoriesStore";
import { ProductsStore } from "./products/ProductsStore";

export class RootStore {
  categories; // CategoriesStore instance
  products; // ProductsStore instance

  constructor() {
    // create children first so they can reference each other via root
    this.categories = new CategoriesStore(this);
    this.products = new ProductsStore(this);

    // optional: make the whole tree reactive (usually not needed,
    // but handy if you want to expose top-level computed values)
    makeAutoObservable(this);
  }
}
