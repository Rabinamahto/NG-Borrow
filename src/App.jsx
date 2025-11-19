import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./auth.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";

// Components & Pages
import Header from "./components/Header";
import Footer from "./components/Footer";
import Hero from "./components/Hero";
import BrowseItems from "./pages/BrowseItems";
import PostItem from "./pages/PostItem";
import RequestItem from "./pages/RequestItem";
import ChatInterface from "./pages/ChatInterface";
import ChatSimple from "./pages/ChatSimple";
import WhatsAppChat from "./pages/WhatsAppChat";
import Profile from "./pages/Profile";
import Notifications from "./pages/Notifications";
import Login from "./pages/Login";
import Signup from "./pages/SignupNew";
import BorrowRequests from "./pages/BorrowRequests";

// 🟢 यह इंपोर्ट तभी काम करेगा जब फ़ाइल src/pages/EditItem.jsx होगी।
import EditItem from "./pages/EditItem"; 

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading auth...</div>;

  return (
    <Router>
      <Header />
      <main className="min-h-[80vh]">
        <Routes>
          {!user && (
            <>
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="*" element={<Navigate to="/login" replace />} />
            </>
          )}

          {user && (
            <>
              <Route path="/" element={<Hero />} />
              <Route path="/browse" element={<ProtectedRoute><BrowseItems /></ProtectedRoute>} />

              {/* Edit route is correctly defined */}
              <Route
                path="/edit-item/:id"
                element={<ProtectedRoute><EditItem /></ProtectedRoute>}
              />

              <Route path="/post" element={<ProtectedRoute><PostItem /></ProtectedRoute>} />
              <Route path="/request" element={<ProtectedRoute><RequestItem /></ProtectedRoute>} />
              <Route path="/borrow-requests" element={<ProtectedRoute><BorrowRequests /></ProtectedRoute>} />
              <Route path="/chat" element={<ProtectedRoute><WhatsAppChat /></ProtectedRoute>} />
              <Route path="/chat-old" element={<ProtectedRoute><ChatInterface /></ProtectedRoute>} />
              <Route path="/chat/:chatId" element={<ProtectedRoute><ChatSimple /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </>
          )}
        </Routes>
      </main>
      <Footer />
    </Router>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}