
import React from "react";
import { Handshake, Search, Send, ShoppingCart, UserCheck, Sparkles } from "lucide-react";

export default function HowItWorks() {
  const steps = [
    {
      icon: <UserCheck className="w-12 h-12 text-blue-600" />,
      title: "1. Create Your Account",
      desc: "Sign up using your student email and complete your profile to join the campus-sharing community.",
    },
    {
      icon: <Search className="w-12 h-12 text-blue-600" />,
      title: "2. Browse Items",
      desc: "Explore items posted by other students — from books and chargers to cycles and tools.",
    },
    {
      icon: <ShoppingCart className="w-12 h-12 text-blue-600" />,
      title: "3. Request or Borrow",
      desc: "Need something urgently? Send a borrow request to the item owner in one tap.",
    },
    {
      icon: <Send className="w-12 h-12 text-blue-600" />,
      title: "4. Chat Instantly",
      desc: "Use our built-in chat system to coordinate and discuss details with the item owner.",
    },
    {
      icon: <Handshake className="w-12 h-12 text-blue-600" />,
      title: "5. Meet & Exchange",
      desc: "Fix a common place on campus, exchange the item, and enjoy the smooth sharing experience.",
    },
  ];

  return (
    <div className="bg-gray-50">

      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-blue-600 to-blue-500 text-white py-20 text-center px-6">
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight">
          How It <span className="text-[#48d6a8]">Works</span>
        </h1>
        <p className="mt-6 text-lg md:text-xl max-w-2xl mx-auto opacity-90">
          A simple, safe, and student-friendly sharing system designed to help 
          you save money and promote sustainability.
        </p>

        <Sparkles className="absolute top-6 right-6 w-12 h-12 opacity-50 text-[#48d6a8]" />
      </section>

      {/* Steps Section */}
      <section className="py-20 px-6 max-w-6xl mx-auto">
        <h2 className="text-center text-3xl md:text-4xl font-bold mb-16">
          Follow These <span className="text-blue-600">Simple Steps</span>
        </h2>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
          {steps.map((step, index) => (
            <div
              key={index}
              className="bg-white p-8 rounded-2xl shadow-lg border border-blue-100 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300"
            >
              <div className="mb-4">{step.icon}</div>
              <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
              <p className="text-gray-600 leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Call To Action */}
      <section className="py-20 text-center bg-blue-600 text-white px-6">
        <h2 className="text-3xl md:text-4xl font-bold mb-6">
          Ready to Get Started?
        </h2>
        <p className="max-w-2xl mx-auto text-lg opacity-90 mb-8">
          Join hundreds of students sharing, helping, and supporting each other across campus.
        </p>

        <a
          href="/signup"
          className="inline-block bg-[#48d6a8] text-blue-900 font-semibold px-8 py-3 rounded-full shadow-lg hover:bg-[#37c398] hover:shadow-xl transition"
        >
          Create Your Account
        </a>
      </section>
    </div>
  );
}