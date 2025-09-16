import { makeAutoObservable, flow } from "mobx";
import * as categoryAPI from "../../api/categories";
import { Category } from "./category";

export class CategoriesStore {
  list = []; // Category[]
  loading = false;
  error = null;

  constructor() {
    makeAutoObservable(this);
  }

  load = flow(function* () {
    // generator = async action
    try {
      this.loading = true;
      const raw = yield categoryAPI.getCategories();
      this.list = raw.map((c) => new Category(c));
    } catch (e) {
      this.error = e;
    } finally {
      this.loading = false;
    }
  });
}
