
import React from "react";
import { ShieldCheck, Users, AlertTriangle, Handshake, ThumbsUp } from "lucide-react";

export default function Guidelines() {
  return (
    <div className="bg-gray-50 min-h-screen text-gray-800 px-6 py-12">

      {/* Header */}
      <div className="max-w-4xl mx-auto text-center mb-12">
        <ShieldCheck className="mx-auto w-16 h-16 text-green-600 mb-4" />
        <h1 className="text-4xl font-bold text-gray-900">Community Guidelines</h1>
        <p className="text-gray-600 mt-3">
          Our goal is to build a safe, supportive and transparent community for students.  
          Please follow these guidelines to ensure a positive experience for everyone on NG Jugaad.
        </p>
      </div>

      <div className="max-w-4xl mx-auto space-y-10">

        {/* Respectful Behaviour */}
        <div className="bg-white p-8 rounded-2xl shadow-md border border-gray-200">
          <div className="flex items-center gap-4 mb-3">
            <Users className="text-blue-600 w-8 h-8" />
            <h2 className="text-2xl font-semibold">1. Respect Everyone</h2>
          </div>
          <p className="text-gray-600 leading-relaxed">
            Maintain a polite and respectful tone while communicating or negotiating with others.  
            Do not use abusive, offensive, or threatening language under any circumstances.
          </p>
        </div>

        {/* Item Quality */}
        <div className="bg-white p-8 rounded-2xl shadow-md border border-gray-200">
          <div className="flex items-center gap-4 mb-3">
            <ThumbsUp className="text-green-600 w-8 h-8" />
            <h2 className="text-2xl font-semibold">2. Share Items in Good Condition</h2>
          </div>
          <p className="text-gray-600 leading-relaxed">
            Only list items that are safe, clean and functional. Any broken or unsafe items should not be posted on the platform.
          </p>
        </div>

        {/* Safety and Prohibited Items */}
        <div className="bg-white p-8 rounded-2xl shadow-md border border-gray-200">
          <div className="flex items-center gap-4 mb-3">
            <AlertTriangle className="text-yellow-500 w-8 h-8" />
            <h2 className="text-2xl font-semibold">3. No Hazardous or Illegal Items</h2>
          </div>
          <p className="text-gray-600 leading-relaxed mb-2">
            Items that may cause harm or are prohibited by law or campus rules must not be shared.
          </p>
          <ul className="list-disc ml-6 text-gray-600 space-y-1">
            <li>Weapons</li>
            <li>Stolen items</li>
            <li>Drugs or intoxicants</li>
            <li>Restricted college property</li>
          </ul>
        </div>

        {/* Clear Communication */}
        <div className="bg-white p-8 rounded-2xl shadow-md border border-gray-200">
          <div className="flex items-center gap-4 mb-3">
            <Handshake className="text-purple-600 w-8 h-8" />
            <h2 className="text-2xl font-semibold">4. Be Honest & Clear</h2>
          </div>
          <p className="text-gray-600 leading-relaxed">
            Provide accurate descriptions, item conditions, and pickup/return times.  
            Avoid last-minute cancellation unless absolutely necessary.
          </p>
        </div>

        {/* Responsibility */}
        <div className="bg-white p-8 rounded-2xl shadow-md border border-gray-200">
          <div className="flex items-center gap-4 mb-3">
            <ShieldCheck className="text-red-500 w-8 h-8" />
            <h2 className="text-2xl font-semibold">5. Take Responsibility</h2>
          </div>
          <p className="text-gray-600 leading-relaxed">
            If you borrow an item, return it in the same condition.  
            If any damage occurs, inform the owner honestly and discuss a fair solution.
          </p>
        </div>

        {/* Report System */}
        <div className="bg-white p-8 rounded-2xl shadow-md border border-gray-200">
          <div className="flex items-center gap-4 mb-3">
            <AlertTriangle className="text-red-600 w-8 h-8" />
            <h2 className="text-2xl font-semibold">6. Report Misconduct</h2>
          </div>
          <p className="text-gray-600 leading-relaxed">
            If you notice any suspicious, abusive or harmful behavior, please report it immediately.  
            This helps keep the community safe and trustworthy.
          </p>
        </div>

        {/* Closing Message */}
        <div className="text-center mt-8">
          <p className="text-gray-700 mb-4 text-lg font-medium">
            Together, we can build a helpful and positive sharing community.
          </p>
          <a
            href="/"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-full font-semibold shadow hover:bg-blue-700 transition"
          >
            Back to Home
          </a>
        </div>

      </div>
    </div>
  );
}