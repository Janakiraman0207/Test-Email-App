import "./App.css";
import "../src/assets/fonts/fonts.css";
import React, { useState, useEffect, useRef } from "react";
import ErrorBoundary from "./Components/ErrorBoundary";
import { AppRoutes } from "./routes/AppRoutes";
import { getAccountActivities, getAccountSettings, getPeopleSettings, getUserProfile } from "./api/api";

function App() {
  // Detect minimal chat route
  const isMinimal = window.location.pathname.match(/^\/chat\/[^/]+\/minimal$/);
  const [sessionExpired, setSessionExpired] = useState(false);
  const redirectingRef = useRef(false);

  useEffect(() => {
    const handleStorageLogout = (event) => {
      if (event.key === "force_logout") {
        redirectingRef.current = true;

        setSessionExpired(true);

        localStorage.clear();
        sessionStorage.clear();

        document.cookie.split(";").forEach((cookie) => {
          document.cookie = cookie
            .replace(/^ +/, "")
            .replace(
              /=.*/,
              "=;expires=" + new Date(0).toUTCString() + ";path=/",
            );
        });

        window.location.href = "/";
      }
    };

    window.addEventListener("storage", handleStorageLogout);

    const validateAuth = async () => {
      const isPublicRoute =
        window.location.pathname === "/" ||
        window.location.pathname.startsWith("/signup");

      if (isPublicRoute || redirectingRef.current) {
        return;
      }

    try {

      const res = await getUserProfile();
const alreadyLoaded = sessionStorage.getItem('email_pref_loaded');
    if (!alreadyLoaded) {
      getAccountSettings()
        .then(data => {
          const emailVal = data.data.email_notifications_account ?? true;
          localStorage.setItem('email_notifications', JSON.stringify(emailVal));
          window.dispatchEvent(new Event('storage'));
          sessionStorage.setItem('email_pref_loaded', 'true');
        })
        .catch(() => {});
        getPeopleSettings()
    .then(data => {
      const contactSuggestionsVal = data.data.contact_suggestions ?? true;
      localStorage.setItem('contact_suggestions', JSON.stringify(contactSuggestionsVal));
      const showProfilePhotosVal = data.data.show_profile_photos ?? true;
      localStorage.setItem('show_profile_photos', JSON.stringify(showProfilePhotosVal));
      sessionStorage.setItem('email_pref_loaded', 'true');
    })
    .catch(() => {});

    }
      

    } catch (error) {

      console.log("SESSION FAILED", error);

      if (error.response?.status === 401) {

        redirectingRef.current = true;

          setSessionExpired(true);

          localStorage.clear();
          sessionStorage.clear();

          document.cookie.split(";").forEach((cookie) => {
            document.cookie = cookie
              .replace(/^ +/, "")
              .replace(
                /=.*/,
                "=;expires=" + new Date(0).toUTCString() + ";path=/",
              );
          });

          clearInterval(interval);

          window.location.href = "/";
        }
      }
    };

    validateAuth();

    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        validateAuth();
      }
    }, 30000);

    return () => {
      clearInterval(interval);

      window.removeEventListener("storage", handleStorageLogout);
    };
  }, []);

  if (sessionExpired) {
    return null;
  }
  return (
    <ErrorBoundary>
      {isMinimal ? (
        <AppRoutes />
      ) : (
        <div className="w-full scrollbar-hide">
          <AppRoutes />
        </div>
      )}
    </ErrorBoundary>
  );
}
export default App;
