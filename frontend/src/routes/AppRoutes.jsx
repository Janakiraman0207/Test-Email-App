import { BrowserRouter, Route, Routes } from "react-router-dom";
import { GlobalSmoothWrapper } from "./GlobalSmoothWrapper";
import { lazy, Suspense } from "react";
import { ScrollToTop } from "../animations/ScrollToTop";
import { SignUpProvider } from "../context/SignUpContext.jsx";

const LoginPage = lazy(() => import("../Components/Pages/Login/LoginPage"));
const SignUpPage = lazy(() => import("../Components/Pages/SignUp/SignUpPage"));
const ForgotPassword = lazy(
  () => import("../Components/Pages/ForgotPassword/ForgotPassword"),
);
const ForgotUsername = lazy(
  () => import("../Components/Pages/ForgotUsername/ForgotUsername"),
);
const SelectEmail = lazy(
  () => import("../Components/Pages/ForgotUsername/SelectEmail"),
);
const UserEnterOtp = lazy(
  () => import("../Components/Pages/ForgotUsername/UserEnterOtp"),
);
const UserDone = lazy(
  () => import("../Components/Pages/ForgotUsername/UserDone"),
);
const EnterPassword = lazy(
  () => import("../Components/Pages/ForgotPassword/EnterPassword"),
);
const EnterOTP = lazy(
  () => import("../Components/Pages/ForgotPassword/EnterOTP"),
);
const Donerest = lazy(
  () => import("../Components/Pages/ForgotPassword/DoneReset"),
);
const ForgotnewPassword = lazy(
  () => import("../Components/Pages/ForgotPassword/ForgotnewPassword"),
);

const Home = lazy(() => import("../Components/Pages/Home/Home.jsx"));
const Calendar = lazy(() => import("../Components/Pages/Calendar/Calendar"));
const ChatHome = lazy(() => import("../Components/Pages/Chat/ChatHome"));
const MinimalChatWrapper = lazy(
  () => import("../Components/Pages/Chat/MinimalChatWrapper"),
);

const DriveHome = lazy(() => import("../Components/Pages/Drive/DriveHome"));
const Settings = lazy(() => import("../Components/Pages/Settings/Settings"));
const SuccessPopUp = lazy(
  () => import("../Components/Pages/Calendar/NewEvents/SuccessPopUp"),
);
const DocumentPreviewPage = lazy(
  () => import("../Components/Pages/Drive/DocumentPreviewPage"),
);

export const AppRoutes = () => {
  return (
    <BrowserRouter>
      <ScrollToTop />

      <Suspense fallback={<div className="text-center mt-10">Loading...</div>}>
        <SignUpProvider>
          <Routes>
            <Route path="/" element={<LoginPage />} />
            <Route path="/signup/:step" element={<SignUpPage />} />

            <Route
              path="/forgot-username"
              element={
                <GlobalSmoothWrapper>
                  <ForgotUsername />
                </GlobalSmoothWrapper>
              }
            />

            <Route
              path="/forgot-password"
              element={
                <GlobalSmoothWrapper>
                  <ForgotPassword />
                </GlobalSmoothWrapper>
              }
            />

            <Route
              path="/select-email"
              element={
                <GlobalSmoothWrapper>
                  <SelectEmail />
                </GlobalSmoothWrapper>
              }
            />

            <Route
              path="/user-enter-otp"
              element={
                <GlobalSmoothWrapper>
                  <UserEnterOtp />
                </GlobalSmoothWrapper>
              }
            />

            <Route
              path="/user-done"
              element={
                <GlobalSmoothWrapper>
                  <UserDone />
                </GlobalSmoothWrapper>
              }
            />

            <Route
              path="/enter-password"
              element={
                <GlobalSmoothWrapper>
                  <EnterPassword />
                </GlobalSmoothWrapper>
              }
            />

            <Route
              path="/enter-otp"
              element={
                <GlobalSmoothWrapper>
                  <EnterOTP />
                </GlobalSmoothWrapper>
              }
            />

            <Route
              path="/done-reset"
              element={
                <GlobalSmoothWrapper>
                  <Donerest />
                </GlobalSmoothWrapper>
              }
            />

            <Route
              path="/forgot-new-password"
              element={
                <GlobalSmoothWrapper>
                  <ForgotnewPassword />
                </GlobalSmoothWrapper>
              }
            />

            <Route
              path="/home"
              element={
                <GlobalSmoothWrapper>
                  <Home />
                </GlobalSmoothWrapper>
              }
            />

            <Route
              path="/calendar"
              element={
                <GlobalSmoothWrapper>
                  <Calendar />
                </GlobalSmoothWrapper>
              }
            />

            {/* ✅ IMPORTANT: Minimal route FIRST */}
            <Route
              path="/chat/minimal/:roomId"
              element={<MinimalChatWrapper />}
            />
            <Route
              path="/chat/:roomId/minimal"
              element={<MinimalChatWrapper />}
            />

            {/* ✅ Main chat route */}
            <Route
              path="/chat/:roomId?"
              element={
                <GlobalSmoothWrapper>
                  <ChatHome />
                </GlobalSmoothWrapper>
              }
            />

            <Route
              path="/drive"
              element={
                <GlobalSmoothWrapper>
                  <DriveHome />
                </GlobalSmoothWrapper>
              }
            />

            <Route
              path="/settings"
              element={
                <GlobalSmoothWrapper>
                  <Settings />
                </GlobalSmoothWrapper>
              }
            />

            <Route
              path="/success-popup"
              element={
                <GlobalSmoothWrapper>
                  <SuccessPopUp />
                </GlobalSmoothWrapper>
              }
            />

            <Route
              path="/SuccessPopUp"
              element={
                <GlobalSmoothWrapper>
                  <SuccessPopUp />
                </GlobalSmoothWrapper>
              }
            />

            <Route
              path="/drive/preview/:fileId"
              element={
                <GlobalSmoothWrapper>
                  <DocumentPreviewPage />
                </GlobalSmoothWrapper>
              }
            />
          </Routes>
        </SignUpProvider>
      </Suspense>
    </BrowserRouter>
  );
};
