import { createBrowserRouter, RouterProvider } from "react-router-dom";
import AuthFlow from "../pages/auth/authFlow";

// eslint-disable-next-line react-refresh/only-export-components
export const router = createBrowserRouter([
  {
    path: "/",
    element: <AuthFlow />,
  },
]);

export default function RoutesRoot() {
  return <RouterProvider router={router} />;
}
