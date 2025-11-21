import React from "react";
import { Users, Target, Sparkles, Recycle, ShieldCheck, Heart } from "lucide-react";

export default function About() {
  return (
    <div className="bg-gray-50 text-gray-800">
      
      {/* Hero Section */}
      <section className="relative bg-blue-600 text-white py-20 px-6 text-center">
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight">
          About <span className="text-[#48d6a8]">NG Jugaad</span>
        </h1>
        <p className="mt-6 text-lg md:text-xl max-w-2xl mx-auto opacity-90">
          Empowering students to save money, share resources, and build a stronger campus community.
        </p>

        <Sparkles className="absolute top-6 right-6 w-12 h-12 text-[#48d6a8] opacity-60" />
      </section>

      {/* Mission & Vision */}
      <section className="py-16 px-6 max-w-6xl mx-auto grid md:grid-cols-2 gap-10">
        <div className="bg-white p-8 rounded-2xl shadow-lg border border-blue-100">
          <Target className="w-12 h-12 text-blue-600 mb-4" />
          <h2 className="text-2xl font-bold mb-3">Our Mission</h2>
          <p className="text-gray-600 leading-relaxed">
            Our mission is to promote smart resource-sharing across campuses.
            We aim to reduce waste, save money, and build a supportive environment where students help each other.
          </p>
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-lg border border-blue-100">
          <Recycle className="w-12 h-12 text-blue-600 mb-4" />
          <h2 className="text-2xl font-bold mb-3">Our Vision</h2>
          <p className="text-gray-600">
            We envision a campus ecosystem where every item finds a new purpose
            and students thrive together by sharing, caring, and connecting.
          </p>
        </div>
      </section>

      {/* Features / Values Section */}
      <section className="py-20 bg-[#f1f5fb] px-6">
        <h2 className="text-center text-3xl md:text-4xl font-bold mb-12">
          Why Choose <span className="text-blue-600">NG Jugaad?</span>
        </h2>

        <div className="grid md:grid-cols-3 gap-10 max-w-6xl mx-auto">

          <div className="bg-white p-8 rounded-xl shadow-md text-center hover:shadow-xl transition">
            <Users className="w-12 h-12 text-blue-600 mx-auto mb-4" />
            <h3 className="font-semibold text-xl mb-3">Student-Centered</h3>
            <p className="text-gray-600">
              A platform built exclusively for students to support each other.
            </p>
          </div>

          <div className="bg-white p-8 rounded-xl shadow-md text-center hover:shadow-xl transition">
            <ShieldCheck className="w-12 h-12 text-blue-600 mx-auto mb-4" />
            <h3 className="font-semibold text-xl mb-3">Safe & Verified</h3>
            <p className="text-gray-600">
              Every user and item is verified to ensure trust and safety.
            </p>
          </div>

          <div className="bg-white p-8 rounded-xl shadow-md text-center hover:shadow-xl transition">
            <Heart className="w-12 h-12 text-blue-600 mx-auto mb-4" />
            <h3 className="font-semibold text-xl mb-3">Community Driven</h3>
            <p className="text-gray-600">
              Built to strengthen campus collaboration and mutual support.
            </p>
          </div>

        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 text-center bg-blue-600 text-white px-6">
        <h2 className="text-3xl md:text-4xl font-bold mb-6">
          Join the NG Jugaad Community Today!
        </h2>
        <p className="max-w-2xl mx-auto text-lg opacity-90 mb-8">
          Together, we can create a smarter, sustainable, and more connected campus life.
        </p>

        <a
          href="/signup"
          className="inline-block bg-[#48d6a8] text-blue-900 font-semibold px-8 py-3 rounded-full shadow-lg hover:shadow-xl hover:bg-[#37c398] transition"
        >
          Get Started
        </a>
      </section>
    </div>
  );
}