
import React from "react";
import { FileText, CheckCircle, AlertTriangle } from "lucide-react";

export default function Terms() {
  return (
    <div className="bg-gray-50 min-h-screen text-gray-800 px-6 py-12">
      
      {/* Header */}
      <div className="max-w-4xl mx-auto text-center mb-12">
        <FileText className="mx-auto text-blue-600 w-16 h-16 mb-4" />
        <h1 className="text-4xl font-bold text-gray-900">Terms &amp; Conditions</h1>
        <p className="text-gray-600 mt-3">
          Please read these terms carefully. By using NG Jugaad, you agree to follow and be bound by these rules.
        </p>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto space-y-8">

        {/* Acceptance */}
        <section className="bg-white shadow-lg p-8 rounded-2xl border border-blue-100">
          <h2 className="text-2xl font-semibold mb-3">1. Acceptance of Terms</h2>
          <p className="text-gray-600 leading-relaxed">
            By accessing or using NG Jugaad, you agree to these Terms &amp; Conditions and our Privacy Policy.
            If you do not agree, please do not use the service.
          </p>
        </section>

        {/* Eligibility */}
        <section className="bg-white shadow-lg p-8 rounded-2xl border border-blue-100">
          <h2 className="text-2xl font-semibold mb-3">2. Eligibility</h2>
          <p className="text-gray-600 leading-relaxed">
            You must be a registered student of your institution and provide accurate information during signup.
            Accounts found to be fraudulent or abusive may be suspended or terminated.
          </p>
        </section>

        {/* User Responsibilities */}
        <section className="bg-white shadow-lg p-8 rounded-2xl border border-blue-100">
          <h2 className="text-2xl font-semibold mb-3">3. User Responsibilities</h2>
          <ul className="list-disc ml-5 text-gray-600 space-y-2">
            <li>Keep your contact and profile information accurate and updated.</li>
            <li>Respect item conditions and return items on agreed time.</li>
            <li>Communicate courteously and settle disputes amicably when possible.</li>
          </ul>
        </section>

        {/* Prohibited Items & Behavior */}
        <section className="bg-white shadow-lg p-8 rounded-2xl border border-blue-100">
          <h2 className="text-2xl font-semibold mb-3">4. Prohibited Items &amp; Behavior</h2>
          <p className="text-gray-600 leading-relaxed mb-3">
            Do not list illegal, hazardous, or unsafe items. Any user posting such items will face immediate removal and possible further action.
          </p>
          <div className="flex items-start gap-3 text-gray-700">
            <AlertTriangle className="w-6 h-6 text-yellow-500 mt-1" />
            <span>
              Examples: weapons, illegal substances, stolen goods, or any items prohibited by campus rules.
            </span>
          </div>
        </section>

        {/* Fees & Payments */}
        <section className="bg-white shadow-lg p-8 rounded-2xl border border-blue-100">
          <h2 className="text-2xl font-semibold mb-3">5. Fees &amp; Payments</h2>
          <p className="text-gray-600 leading-relaxed">
            NG Jugaad core features are free. If any paid or premium feature is introduced in future, separate terms will apply and users will be notified.
          </p>
        </section>

        {/* Dispute Resolution */}
        <section className="bg-white shadow-lg p-8 rounded-2xl border border-blue-100">
          <h2 className="text-2xl font-semibold mb-3">6. Dispute Resolution</h2>
          <p className="text-gray-600 leading-relaxed">
            In case of disputes between users, we encourage direct resolution. If unresolved, report to support and our team will review and act per our policies.
          </p>
        </section>

        {/* Termination */}
        <section className="bg-white shadow-lg p-8 rounded-2xl border border-blue-100">
          <h2 className="text-2xl font-semibold mb-3">7. Termination</h2>
          <p className="text-gray-600 leading-relaxed">
            We reserve the right to suspend or terminate accounts violating terms, misusing the platform, or threatening community safety.
          </p>
        </section>

        {/* Liability */}
        <section className="bg-white shadow-lg p-8 rounded-2xl border border-blue-100">
          <h2 className="text-2xl font-semibold mb-3">8. Limitation of Liability</h2>
          <p className="text-gray-600 leading-relaxed">
            NG Jugaad is a facilitator. We are not liable for personal property loss, damage, or disputes arising from offline exchanges between users.
          </p>
        </section>

        {/* Changes */}
        <section className="bg-white shadow-lg p-8 rounded-2xl border border-blue-100">
          <h2 className="text-2xl font-semibold mb-3">9. Changes to Terms</h2>
          <p className="text-gray-600 leading-relaxed">
            We may update these terms occasionally. When material changes occur, we will notify users through the app or email.
          </p>
        </section>

        {/* Acceptance CTA */}
        <div className="text-center mt-6">
          <CheckCircle className="mx-auto w-12 h-12 text-green-600 mb-3" />
          <p className="text-gray-700 mb-4">
            By using NG Jugaad you confirm that you have read, understood, and accept these terms.
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