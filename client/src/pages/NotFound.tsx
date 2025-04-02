
import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-app-light-gray">
      <div className="text-center bg-white p-8 rounded-lg shadow-lg">
        <h1 className="text-6xl font-bold text-app-primary mb-4">404</h1>
        <p className="text-xl text-gray-600 mb-6">Oops! This page doesn't exist</p>
        <a href="/" className="px-6 py-3 bg-app-secondary text-white rounded-md hover:bg-opacity-90 transition">
          Return to Order System
        </a>
      </div>
    </div>
  );
};

export default NotFound;
