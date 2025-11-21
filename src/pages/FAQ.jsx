
import { useState } from "react";
import { HelpCircle, ChevronDown } from "lucide-react";

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(null);

  const faqs = [
    {
      q: "What is this platform about?",
      a: "This platform helps users explore services, learn features, and get support easily with a smooth user interface."
    },
    {
      q: "How do I contact support?",
      a: "Go to the Help page and fill out the support form. Our team will respond within 24 hours."
    },
    {
      q: "Is my data safe here?",
      a: "Yes, your data is fully secure. We use advanced encryption and do not share data with third parties."
    },
    {
      q: "Can I update my profile?",
      a: "Yes, you can update your profile anytime from the account settings section."
    },
    {
      q: "Is this service free?",
      a: "Yes, basic features are free. Premium features may require a subscription."
    }
  ];

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="bg-gray-50 min-h-screen py-12 px-5 text-gray-800">

      {/* Header */}
      <div className="max-w-3xl mx-auto text-center mb-12">
        <HelpCircle className="w-16 h-16 mx-auto text-blue-600 mb-4" />
        <h1 className="text-4xl font-bold text-gray-900">Frequently Asked Questions</h1>
        <p className="text-gray-600 mt-3">
          Find answers to the most common questions asked by users.
        </p>
      </div>

      {/* FAQ List */}
      <div className="max-w-3xl mx-auto space-y-6">
        {faqs.map((faq, index) => (
          <div
            key={index}
            className="bg-white shadow-md p-6 rounded-xl cursor-pointer transition-all duration-300"
            onClick={() => toggleFAQ(index)}
          >
            {/* Question */}
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">{faq.q}</h2>
              <ChevronDown
                className={`w-6 h-6 text-gray-600 transition-transform duration-300 ${
                  openIndex === index ? "rotate-180" : ""
                }`}
              />
            </div>

            {/* Answer */}
            <div
              className={`mt-3 text-gray-600 leading-7 overflow-hidden transition-all duration-300 ${
                openIndex === index ? "max-h-40" : "max-h-0"
              }`}
            >
              {faq.a}
            </div>
          </div>
        ))}
      </div>

      {/* Footer Note */}
      <div className="text-center mt-14 text-gray-500">
        Didn’t find your answer? Reach out to our support team anytime.
      </div>
    </div>
  );
}