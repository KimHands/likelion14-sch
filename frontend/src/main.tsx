import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import SignupDone from "./pages/SignupDone"; // ✅ 추가

import AdminApplicants from "./pages/AdminApplicants";
import Apply from "./pages/Apply";
import Session from "./pages/Session";
import RequireAuth from "./auth/RequireAuth";
import VerifyEmailPage from "./pages/VerifyEmailPage";
import AdminDocScore from "./pages/AdminDocScore.tsx";
import AdminInterviewScore from "./pages/AdminInterviewScore";
import Members from "./pages/Members";
import Curriculum from "./pages/Curriculum";
import AdminDashboard from "./pages/AdminDashboard.tsx";
import AdminSessions from "./pages/AdminSessions";
import AdminProjects from "./pages/AdminProjects";
import AdminRoadmap from "./pages/AdminRoadmap";

const router = createBrowserRouter([
  { path: "/", element: <Home /> },
  { path: "/login", element: <Login /> },
  { path: "/signup", element: <Signup /> },
  { path: "/signup/done", element: <SignupDone /> },
  { path: "/members", element: <Members /> }, // ✅ 추가
  { path: "/tracks", element: <Curriculum /> },

  {
    path: "/admin",
    element: (
      <RequireAuth allow={["INSTRUCTOR"]}>
        <AdminDashboard />
      </RequireAuth>
    ),
  },
  {
    path: "/admin/sessions",
    element: (
      <RequireAuth allow={["INSTRUCTOR"]}>
        <AdminSessions />
      </RequireAuth>
    ),
  },
  {
    path: "/admin/projects",
    element: (
      <RequireAuth allow={["INSTRUCTOR"]}>
        <AdminProjects />
      </RequireAuth>
    ),
  },
  {
    path: "/admin/roadmap",
    element: (
      <RequireAuth allow={["INSTRUCTOR"]}>
        <AdminRoadmap />
      </RequireAuth>
    ),
  },
  {
    path: "/apply",
    element: (
      <RequireAuth allow={["APPLICANT"]}>
        <Apply />
      </RequireAuth>
    ),
  },

  {
    path: "/admin/applicants/:appId/doc",
    element: (
      <RequireAuth allow={["INSTRUCTOR"]}>
        <AdminDocScore />
      </RequireAuth>
    ),
  },
  {
    path: "/admin/applicants/:appId/interview",
    element: (
      <RequireAuth allow={["INSTRUCTOR"]}>
        <AdminInterviewScore />
      </RequireAuth>
    ),
  },
  {
    path: "/admin/applicants",
    element: (
      <RequireAuth allow={["INSTRUCTOR"]}>
        <AdminApplicants />
      </RequireAuth>
    ),
  },
  {
    path: "/session",
    element: (
      <RequireAuth allow={["STUDENT", "INSTRUCTOR"]}>
        <Session />
      </RequireAuth>
    ),
  },
  {
    path: "/verify-email",
    element: (
      <RequireAuth skipEmailVerified>
        <VerifyEmailPage />
      </RequireAuth>
    ),
  },
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);