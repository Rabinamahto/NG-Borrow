import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom"; 
import { useAuth } from "../auth.jsx";
import {
  DollarSign,
  Handshake,
  RefreshCw,
} from "lucide-react";
import BrowseItems from "../pages/BrowseItems";

const HERO_IMAGE =
  "https://media.istockphoto.com/id/1176189278/photo/man-and-woman-exchanging-the-books.jpg?s=612x612&w=0&k=20&c=nzRc8ay4re3fylmepxFZqvlaw4UhQ1CwWNdV6Oxx5Cs=";


const Home = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const cardVariants = {
    hidden: { opacity: 0, y: 40 },
    visible: (i) => ({ opacity: 1, y: 0, transition: { delay: i * 0.15, type: "spring", stiffness: 100 } }),
  };

  const mainFeatures = [
    { title: "Save Money", description: "Borrow items instead of buying and save more!", icon: <DollarSign className="w-5 h-5 text-white" />, bg: "bg-blue-500" },
    { title: "Build Trust", description: "Connect & share with students in your community.", icon: <Handshake className="w-5 h-5 text-white" />, bg: "bg-green-500" },
    { title: "Circular Economy", description: "Reduce waste by reusing and sharing items.", icon: <RefreshCw className="w-5 h-5 text-white" />, bg: "bg-purple-500" },
  ];

  return (
    <div className="w-full font-sans">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
        className="relative h-[400px] sm:h-[450px] md:h-[500px] lg:h-[550px] overflow-hidden" 
      >
        <img
          src={HERO_IMAGE}
          alt="Sharing community"
          className="w-full h-full object-cover brightness-75"
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4 sm:p-6 text-white">
          <motion.h1
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold mb-3 sm:mb-4 drop-shadow-lg"
          >
            Share & Borrow
          </motion.h1>
          <motion.p
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 1 }}
            className="max-w-xl sm:max-w-2xl md:max-w-3xl text-base sm:text-lg md:text-xl mb-4 sm:mb-6 drop-shadow-md"
          >
            Save money, build trust, and reduce waste through community sharing.
          </motion.p>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-4 justify-center flex-wrap">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-full sm:w-auto min-w-[160px] bg-white text-[#3a75c4] font-semibold px-4 sm:px-6 py-2 sm:py-3 rounded-lg shadow-lg hover:bg-gray-100 transition-all text-sm sm:text-base"
              onClick={() => navigate("/post")}
            >
              Post Your Item
            </motion.button>

<motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-full sm:w-auto min-w-[160px] bg-[#48d6a8] text-white font-semibold px-4 sm:px-6 py-2 sm:py-3 rounded-lg shadow-lg hover:bg-[#3ab68c] transition-all text-sm sm:text-base"
              onClick={() => navigate("/borrow-requests")}
            >
              Request Item
            </motion.button>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 mt-8 sm:mt-10 justify-center flex-wrap">
            {mainFeatures.map((feature, i) => (
              <motion.div
                key={i}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={cardVariants}
                className="flex flex-col items-center bg-white rounded-2xl shadow-lg p-4 sm:p-6 w-full sm:w-44 md:w-52 text-center cursor-pointer transform hover:scale-105 hover:shadow-2xl transition-all duration-300 relative overflow-hidden"
              >
                <div className={`absolute -top-10 -right-10 w-20 h-20 sm:w-24 sm:h-24 rounded-full opacity-20 ${feature.bg}`}></div>
                <div className={`p-3 sm:p-4 rounded-full ${feature.bg} mb-3 sm:mb-4 shadow-md flex items-center justify-center z-10`}>
                  {feature.icon}
                </div>
                <h4 className="font-bold text-base sm:text-lg md:text-lg z-10">{feature.title}</h4>
                <p className="text-xs sm:text-sm md:text-sm mt-1 text-gray-700 z-10">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
        <div className="absolute bottom-0 w-full h-16 sm:h-20 bg-gradient-to-t from-white to-transparent"></div>
      </motion.div>

      <div className="px-4 sm:px-6 md:px-8 py-8 sm:py-10 md:py-12 bg-gray-50">
        
       
        <div className="mt-8">
          {/* Show a subset of browse items under the Home hero section (no search here) */}
          <BrowseItems maxItems={8} showSearch={false} />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mt-6 sm:mt-8 text-center"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            
            whileTap={{ scale: 0.95 }}
            className="bg-[#48d6a8] text-white font-semibold px-8 sm:px-10 py-2.5 sm:py-3 rounded-lg shadow-lg hover:bg-[#3ab68c] transition-all text-sm sm:text-base"
            onClick={() => navigate("/browse")}
          >
            View All Products
          </motion.button>
        </motion.div>

       
      </div>
    </div>
  );
};

export default Home;