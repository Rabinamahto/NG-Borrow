
import React from "react";
import { HelpCircle, Mail, MessageSquare, Phone, Search, Sparkles, ArrowRight } from "lucide-react";

export default function Help() {
  const faq = [
    {
      q: "How do I borrow an item?",
      a: "Browse items, open any item page, and click the 'Request to Borrow' button. The owner will approve your request."
    },
    {
      q: "Is NG Jugaad free to use?",
      a: "Yes! The platform is completely free for students. No hidden fees or charges."
    },
    {
      q: "How do I chat with the item owner?",
      a: "Once you request or post an item, you will automatically get a chat room with the owner/requester."
    },
    {
      q: "What if someone doesn't return my item?",
      a: "You can report that user from the item or profile page. Our team will take immediate action."
    },
  ];

  const helpCards = [
    {
      icon: <Search className="w-10 h-10 text-blue-600" />,
      title: "Search FAQs",
      desc: "Find answers to commonly asked questions quickly.",
    },
    {
      icon: <MessageSquare className="w-10 h-10 text-blue-600" />,
      title: "Chat Support",
      desc: "Reach out anytime for instant help from our support team.",
    },
    {
      icon: <Mail className="w-10 h-10 text-blue-600" />,
      title: "Email Us",
      desc: "Send us your queries and we’ll get back within 24 hours.",
    },
  ];

  return (
    <div className="bg-gray-50">

      {/* HERO */}
      <section className="relative bg-gradient-to-r from-blue-600 to-blue-500 text-white py-20 px-6 text-center">
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight">
          Help <span className="text-[#48d6a8]">Center</span>
        </h1>
        <p className="mt-6 text-lg md:text-xl max-w-2xl mx-auto opacity-90">
          We're here to help you with anything you need — from borrowing items to using the platform safely.
        </p>
        <Sparkles className="absolute top-6 right-6 w-12 h-12 text-[#48d6a8] opacity-50" />
      </section>

      {/* HELP CARDS */}
      <section className="py-20 max-w-6xl mx-auto px-6 grid md:grid-cols-3 gap-10">
        {helpCards.map((card, i) => (
          <div
            key={i}
            className="bg-white rounded-2xl shadow-lg border border-blue-100 p-8 text-center hover:shadow-2xl hover:-translate-y-2 transition-all duration-300"
          >
            <div className="mb-4 flex justify-center">{card.icon}</div>
            <h3 className="text-xl font-bold mb-3">{card.title}</h3>
            <p className="text-gray-600">{card.desc}</p>
          </div>
        ))}
      </section>

      {/* FAQ SECTION */}
      <section className="py-20 bg-[#f1f5fb] px-6">
        <h2 className="text-center text-3xl md:text-4xl font-bold mb-12">
          Frequently Asked <span className="text-blue-600">Questions</span>
        </h2>

        <div className="max-w-4xl mx-auto space-y-6">
          {faq.map((item, i) => (
            <div
              key={i}
              className="bg-white shadow-md p-6 rounded-xl border border-blue-100"
            >
              <h4 className="text-lg font-semibold mb-2 flex items-center gap-2">
                <HelpCircle className="w-6 h-6 text-blue-600" /> {item.q}
              </h4>
              <p className="text-gray-700 ml-8">{item.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CONTACT SECTION */}
      <section className="py-20 text-center bg-blue-600 text-white px-6">
        <h2 className="text-3xl md:text-4xl font-bold mb-6">Still Need Help?</h2>
        <p className="max-w-2xl mx-auto text-lg opacity-90 mb-8">
          Our support team is available 24/7 to guide you through any issue.
        </p>

        <a
          href="mailto:support@campusshare.edu"
          className="inline-flex items-center gap-2 bg-[#48d6a8] text-blue-900 font-semibold px-8 py-3 rounded-full shadow-lg hover:bg-[#37c398] hover:shadow-xl transition"
        >
          Contact Support <ArrowRight />
        </a>
      </section>
    </div>
  );
}