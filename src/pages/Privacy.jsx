
import { ShieldCheck, Lock, Eye, FileText, Info } from "lucide-react";

export default function Privacy() {
  return (
    <div className="bg-gray-50 min-h-screen text-gray-800 px-6 py-12">
      
      {/* Header Section */}
      <div className="max-w-4xl mx-auto text-center mb-12">
        <Lock className="mx-auto text-blue-600 w-16 h-16 mb-4" />
        <h1 className="text-4xl font-bold text-gray-900">Privacy Policy</h1>
        <p className="text-gray-600 mt-3">
          Your privacy is important to us. Below is our clear explanation of how we handle your data.
        </p>
      </div>

      {/* Content Section */}
      <div className="max-w-4xl mx-auto space-y-10">

        {/* Data Collection */}
        <section className="bg-white shadow-lg p-8 rounded-2xl">
          <div className="flex items-center gap-3 mb-4">
            <FileText className="text-blue-600 w-8 h-8" />
            <h2 className="text-2xl font-semibold">1. Information We Collect</h2>
          </div>
          <p className="text-gray-600 leading-7">
            We collect basic information like name, email, and account activity only to improve your
            experience. We never collect unnecessary personal information.
          </p>
        </section>

        {/* Data Security */}
        <section className="bg-white shadow-lg p-8 rounded-2xl">
          <div className="flex items-center gap-3 mb-4">
            <ShieldCheck className="text-green-600 w-8 h-8" />
            <h2 className="text-2xl font-semibold">2. How We Protect Your Data</h2>
          </div>
          <p className="text-gray-600 leading-7">
            Your data is stored securely using encryption and advanced protection methods. We ensure
            full safety from unauthorized access.
          </p>
        </section>

        {/* User Rights */}
        <section className="bg-white shadow-lg p-8 rounded-2xl">
          <div className="flex items-center gap-3 mb-4">
            <Eye className="text-purple-600 w-8 h-8" />
            <h2 className="text-2xl font-semibold">3. Your Rights</h2>
          </div>
          <ul className="text-gray-600 leading-7 list-disc ml-5">
            <li>Access your data</li>
            <li>Update or correct your information</li>
            <li>Request account deletion anytime</li>
            <li>Control what information you share</li>
          </ul>
        </section>

        {/* Why We Collect Data */}
        <section className="bg-white shadow-lg p-8 rounded-2xl">
          <div className="flex items-center gap-3 mb-4">
            <Info className="text-orange-600 w-8 h-8" />
            <h2 className="text-2xl font-semibold">4. Why We Collect Data</h2>
          </div>
          <p className="text-gray-600 leading-7">
            We only collect data to personalize your experience, improve services, and ensure platform
            safety. We never sell your data to any third party.
          </p>
        </section>

        {/* Bottom Note */}
        <div className="text-center mt-14">
          <p className="text-gray-500">
            If you have any questions regarding privacy, feel free to contact our support team.
          </p>
        </div>

      </div>
    </div>
  );
}