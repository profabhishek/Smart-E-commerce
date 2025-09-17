import { Outlet } from "react-router-dom";
import ScrollToTop from "../components/ScrollToTop";

export default function AppLayout() {
  return (
    <>
      <ScrollToTop />
      <Outlet /> {/* child routes will render here */}
    </>
  );
}
