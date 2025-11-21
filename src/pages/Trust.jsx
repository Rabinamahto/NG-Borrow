
import React from "react";
import {
  ShieldCheck,
  Lock,
  Users,
  CheckCircle,
  MessageSquare,
  ThumbsUp,
  Sparkles,
} from "lucide-react";

export default function Trust() {
  const safetyPoints = [
    {
      icon: <ShieldCheck className="w-12 h-12 text-blue-600" />,
      title: "Verified Students Only",
      desc: "Every user is verified using student email or campus ID to ensure a trusted community.",
    },
    {
      icon: <Lock className="w-12 h-12 text-blue-600" />,
      title: "Secure Information",
      desc: "Your personal data is safely encrypted and never shared without permission.",
    },
    {
      icon: <MessageSquare className="w-12 h-12 text-blue-600" />,
      title: "Safe Communication",
      desc: "Chat safely within the platform without sharing personal phone numbers.",
    },
    {
      icon: <Users className="w-12 h-12 text-blue-600" />,
      title: "Community Moderation",
      desc: "Any reported user or item is reviewed immediately by our team.",
    },
    {
      icon: <CheckCircle className="w-12 h-12 text-blue-600" />,
      title: "Verified Items",
      desc: "Every item goes through a basic verification check before becoming visible to others.",
    },
    {
      icon: <ThumbsUp className="w-12 h-12 text-blue-600" />,
      title: "Transparent Ratings",
      desc: "Users can rate each other after item exchange to maintain trust.",
    },
  ];

  return (
    <div className="bg-gray-50">
      
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-blue-600 to-blue-500 text-white py-20 text-center px-6">
        <h1 className="text-4xl md:text-6xl font-extrabold">
          Trust & <span className="text-[#48d6a8]">Safety</span>
        </h1>
        <p className="mt-6 text-lg md:text-xl max-w-2xl mx-auto opacity-90">
          Your safety is our top priority. We ensure a secure and reliable environment
          so students can share and borrow with confidence.
        </p>
        <Sparkles className="absolute top-6 right-6 w-12 h-12 opacity-50 text-[#48d6a8]" />
      </section>

      {/* Protection Features */}
      <section className="py-20 px-6 max-w-7xl mx-auto">
        <h2 className="text-center text-3xl md:text-4xl font-bold mb-14">
          Our Commitment to <span className="text-blue-600">Your Safety</span>
        </h2>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
          {safetyPoints.map((item, i) => (
            <div
              key={i}
              className="bg-white p-8 rounded-2xl shadow-lg border border-blue-100 hover:-translate-y-2 hover:shadow-2xl transition-all duration-300"
            >
              <div className="mb-4">{item.icon}</div>
              <h3 className="text-xl font-semibold mb-3">{item.title}</h3>
              <p className="text-gray-600">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Security Tips */}
      <section className="py-20 bg-[#f1f5fb] px-6">
        <h2 className="text-center text-3xl md:text-4xl font-bold mb-10">
          Safety Tips for Students
        </h2>

        <ul className="max-w-4xl mx-auto space-y-5 text-gray-700 text-lg">
          <li>✔ Always meet in public or campus-approved locations.</li>
          <li>✔ Check the item condition before borrowing.</li>
          <li>✔ Avoid sharing private contact details unless necessary.</li>
          <li>✔ Report any suspicious user or behavior immediately.</li>
          <li>✔ Communicate only through platform chat for safety.</li>
        </ul>
      </section>

      {/* CTA */}
      <section className="py-20 text-center bg-blue-600 text-white px-6">
        <h2 className="text-3xl md:text-4xl font-bold mb-6">
          Together, We Build a Safe Community
        </h2>
        <p className="max-w-2xl mx-auto text-lg opacity-90 mb-8">
          NG Jugaad works to create a secure, verified, and trusted sharing experience 
          for every student on campus.
        </p>

        <a
          href="/help"
          className="inline-block bg-[#48d6a8] text-blue-900 font-semibold px-8 py-3 rounded-full shadow-lg hover:bg-[#37c398] hover:shadow-xl transition"
        >
          Visit Help Center
        </a>
      </section>
    </div>
  );
}