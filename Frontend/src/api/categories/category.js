import { makeAutoObservable } from "mobx";
export class Category {
  id;
  name;
  products = [];
  constructor(data) {
    Object.assign(this, data);
    makeAutoObservable(this);
  }
}
