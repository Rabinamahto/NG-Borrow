
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
import EditItem from "./pages/EditItem";

import About from "./pages/About.jsx";
import HowItWorks from "./pages/HowItWorks.jsx";
import Trust from "./pages/Trust.jsx";
import FAQ from "./pages/FAQ.jsx";
import Guidelines from "./pages/Guidelines.jsx";
import Terms from "./pages/Terms.jsx";
import Privacy from "./pages/Privacy.jsx";
import Help from "./pages/Help.jsx";

function AppRoutes() {
  const{user, loading}=useAuth();
  if(loading) return <div>Loading auth...</div>
  return (
    <Router>
      <Header />
      <main className="min-h-[80vh]">
        <Routes>

<Route path="/about" element={<About/>}/>
<Route path="/how-it-works" element={<HowItWorks/>} />
<Route path="/trust" element={<Trust/>} />          
<Route path="/faq" element={<FAQ/>} />          
<Route path="/guidelines" element={<Guidelines/>} />          
<Route path="/terms" element={<Terms/>} />          
<Route path="/privacy" element={<Privacy/>} />          
<Route path="/help" element={<Help/>} />          

          {/* Auth Pages */}
          {!user && (
            <>
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="*" element={<Navigate to="/login" replace />} />
            </>
          )}

          {/* Private Authenticated Routes */}
          {user && (
            <>
              <Route path="/" element={<Hero />} />
              <Route path="/browse" element={<ProtectedRoute><BrowseItems /></ProtectedRoute>} />

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