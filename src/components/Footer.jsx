
import React from 'react';
import { Mail, MapPin, Twitter, Instagram, Linkedin } from 'lucide-react';

const Footer = () => {
  const quickLinks = [
    { name: 'About Us', href: '/about' },
    { name: 'How It Works', href: '/how-it-works' },
    { name: 'Trust & Safety', href: '/trust' },
    { name: 'FAQ', href: '/faq' },
  ];

  const resources = [
    { name: 'Community Guidelines', href: '/guidelines' },
    { name: 'Terms of Service', href: '/terms' },
    { name: 'Privacy Policy', href: '/privacy' },
    { name: 'Help Center', href: '/help' },
  ];

  const iconClass =
    "w-6 h-6 text-white hover:text-[#48d6a8] transition duration-200";

  return (
    <footer className="bg-[#3a75c4] text-white py-12 mt-16 font-sans">
      <div className="max-w-7xl mx-auto px-4 md:px-8">

        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 border-b border-blue-400 pb-8">

          {/* Brand Section */}
          <div>
            <h3 className="text-3xl font-extrabold mb-3">NG Jugaad</h3>
            <p className="text-sm text-blue-100">
              “Empowering students to save money and promote sustainability by enabling 
              the sharing of resources across the campus.”
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4 text-[#48d6a8]">
              Quick Links
            </h4>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="text-blue-100 text-sm hover:text-white transition duration-200"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-lg font-semibold mb-4 text-[#48d6a8]">
              Legal & Resources
            </h4>
            <ul className="space-y-3">
              {resources.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="text-blue-100 text-sm hover:text-white transition duration-200"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-lg font-semibold mb-4 text-[#48d6a8]">Get In Touch</h4>

            <address className="space-y-3 not-italic text-sm">
              <p className="flex items-start text-blue-100">
                <Mail size={20} className="mr-3 mt-1" />
                <span>support@campusshare.edu</span>
              </p>

              <p className="flex items-start text-blue-100">
                <MapPin size={20} className="mr-3 mt-1" />
                <span>University Hub, Room 101, City, State</span>
              </p>
            </address>
          </div>
        </div>

        <div className="pt-8 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <p className="text-sm text-blue-200">
            &copy; {new Date().getFullYear()} NG Jugaad. All rights reserved.
          </p>

          <div className="flex space-x-6">
            <a href="#" aria-label="Twitter"><Twitter className={iconClass} /></a>
            <a href="#" aria-label="Instagram"><Instagram className={iconClass} /></a>
            <a href="#" aria-label="LinkedIn"><Linkedin className={iconClass} /></a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;