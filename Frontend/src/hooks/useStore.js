import { useContext } from "react";
import { RootStoreContext } from "../contexts/RootStoreContext";
export const useStore = () => useContext(RootStoreContext);
