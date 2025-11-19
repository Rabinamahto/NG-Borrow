import React, { useState, useCallback } from "react";
// Lucide icons imports: Zaruri icons yahaan hain
import { User, Zap, Clock, CheckCircle, XCircle, Star, ChevronDown, ChevronUp, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react"; 

// --- Helper Function: Date Formatting ---
const formatButtonDate = (dateString) => {
    if (!dateString) return 'Date';
    try {
        const date = new Date(dateString);
        // Format: Month (Short) Day (2-digit) -> Jaise: 'Nov 15'
        return date.toLocaleDateString('en-US', { month: 'short', day: '2-digit' }); 
    } catch (e) {
        return 'Date';
    }
};

// --- Helper Component: Image Carousel (Multi-Image Viewer) ---
const ImageCarousel = ({ images, category, status }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const showNavigation = images.length > 1; // Controls sirf tab dikhenge jab ek se zyada image ho

    const nextImage = (e) => {
        // Event propagation rokna zaroori hai taki card click na ho
        e.stopPropagation(); 
        setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
    };

    const prevImage = (e) => {
        e.stopPropagation(); 
        setCurrentIndex((prevIndex) => (prevIndex - 1 + images.length) % images.length);
    };

    const currentImage = images[currentIndex];
    
    // Status/category ke hisaab se background color
    let bgColorClass = 'bg-gray-700';
    if (category === 'CALCULATOR') bgColorClass = 'bg-gray-700';
    else if (category === 'JS BOOK') bgColorClass = 'bg-blue-600';
    else if (category === 'HDMI CABLE') bgColorClass = 'bg-purple-600';
    else if (category === 'PROGRAMMING') bgColorClass = 'bg-teal-500'; 
    else if (category === 'MONITOR') bgColorClass = 'bg-purple-700';
    else if (category === 'ALGORITHMS') bgColorClass = 'bg-blue-600';
    else if (category === 'MOUSE') bgColorClass = 'bg-orange-500';
    else if (category === 'ADAPTER') bgColorClass = 'bg-pink-600';
    else if (category === 'KEYBOARD') bgColorClass = 'bg-gray-800';
    else if (category === 'NETWORKING') bgColorClass = 'bg-cyan-600';
    else if (category === 'STORAGE') bgColorClass = 'bg-red-700';
    else if (category === 'WEBCAM') bgColorClass = 'bg-emerald-600';
    else bgColorClass = 'bg-gray-700'; 
    
    // Image height ko h-40 par hi rakha gaya hai
    return (
        <div className={`w-full h-40 flex items-center justify-center rounded-t-xl overflow-hidden relative p-3 ${bgColorClass}`}>
            
            {/* Image Source - Placeholder Image */}
            <div className="absolute inset-0 z-0 opacity-50">
                 <img 
                    src={currentImage} 
                    alt={`${category} - Image ${currentIndex + 1}`} 
                    className="w-full h-full object-cover" 
                    onError={(e) => { e.target.style.display = 'none'; }}
                />
            </div>
            
            {/* Navigation Buttons (Sirf jab 1 se zyada image ho) */}
            {showNavigation && (
                <>
                    {/* Previous Button - Increased opacity for better visibility */}
                    <button
                        onClick={prevImage}
                        className="absolute left-2 top-1/2 transform -translate-y-1/2 p-2 
                                   bg-black/60 text-white rounded-full hover:bg-black/80 
                                   transition opacity-100 focus:opacity-100 z-20 shadow-lg"
                        aria-label="Previous Image"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    {/* Next Button - Increased opacity for better visibility */}
                    <button
                        onClick={nextImage}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 
                                   bg-black/60 text-white rounded-full hover:bg-black/80 
                                   transition opacity-100 focus:opacity-100 z-20 shadow-lg"
                        aria-label="Next Image"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                    
                    {/* Small Dots (Image Indicators) */}
                    <div className="flex absolute bottom-2 space-x-1 z-30">
                        {images.map((_, index) => (
                            <div
                                key={index}
                                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                                    index === currentIndex ? 'bg-white w-4' : 'bg-white/50'
                                }`}
                            />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

// --- Helper Component: Star Rating ---
const StarRating = ({ rating }) => {
  return (
    <div className="flex items-center space-x-1">
        <Star className="w-3 h-3 text-yellow-500 fill-yellow-500/80" /> 
        <span className="text-sm font-bold text-gray-900">{rating.toFixed(1)}</span>
        <span className="text-xs font-medium text-gray-500">(Rating)</span>
    </div>
  );
};

// --- Helper Component: Status Dropdown Menu (Only for Available Items) ---
const StatusDropdown = ({ item, onStatusChange, toggleMenu }) => {
    // Status badalne ke options
    const statusOptions = [
        { 
            label: "1. Accept", 
            status: "ACCEPTED", 
            icon: CheckCircle, 
            class: "hover:bg-green-100 text-green-700" 
        },
        { 
            label: "2. Pending", 
            status: "PENDING", 
            icon: Clock, 
            class: "hover:bg-yellow-100 text-yellow-700" 
        },
        { 
            label: "3. Unavailable", 
            status: "UNAVAILABLE", 
            icon: XCircle, 
            class: "hover:bg-red-100 text-red-700" 
        },
        { 
            label: "4. Reset to Available", 
            status: "AVAILABLE", 
            icon: RefreshCw, 
            class: "hover:bg-gray-100 text-gray-700" 
        },
    ];

    const handleSelect = (newStatus) => {
        let newDate = null;
        if (newStatus === 'ACCEPTED') {
             // Agar ACCEPTED chuna gaya hai, to pickup date set karo (7 din aage)
             const date = new Date();
             date.setDate(date.getDate() + 7); 
             newDate = date.toISOString().split('T')[0];
        } else if (newStatus === 'AVAILABLE') {
            // Agar AVAILABLE chuna gaya hai, to availableAfter clear karo
            newDate = null;
        }
        
        onStatusChange(item.id, newStatus, newDate);
        toggleMenu(); 
    };

    // Dropdown menu button ke upar 'absolute bottom-full' position mein hai.
    return (
        <div className="absolute bottom-full left-0 right-0 mb-3 z-20 
                        bg-white border border-gray-300 rounded-xl shadow-2xl 
                        transform scale-y-100 opacity-100 transition duration-300 
                        origin-bottom">
            <div className="py-2">
                <p className="px-4 py-2 text-sm font-bold text-gray-700 border-b border-gray-100">
                    Status Options for: {item.name}
                </p>
                {statusOptions.map(option => (
                    <button
                        key={option.status}
                        onClick={() => handleSelect(option.status)}
                        className={`w-full text-left px-4 py-2 text-base font-medium 
                                    transition duration-200 flex items-center ${option.class} 
                                    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500`}
                    >
                        <option.icon className="w-5 h-5 mr-3" />
                        {option.label}
                    </button>
                ))}
            </div>
        </div>
    );
};

// --- Helper Component: Action Footer (FOR AVAILABLE ITEMS - with interactive dropdown) ---
const ItemActionFooter = ({ item, updateItemStatus }) => {
  // Yeh component sirf Available Items ke liye render hoga
  const [showStatusMenu, setShowStatusMenu] = useState(false);

  const toggleMenu = () => {
    setShowStatusMenu(prev => !prev);
  };
  
  const currentStatus = item.status; 
  let buttonText = "";
  let buttonClass = ""; 
  
  if (currentStatus === 'AVAILABLE') { 
      // Available item par default button 'Request' hoga
      buttonText = "Request"; 
      buttonClass = "bg-violet-600 hover:bg-violet-700 active:bg-violet-800 focus:ring-violet-300"; 
      
  } else {
      // Status update hone par button text change hoga
      if (currentStatus === 'PENDING') {
          // --- User Requested Text for PENDING ---
          buttonText = "Pending Approval (In Action)"; 
          buttonClass = "bg-yellow-500 hover:bg-yellow-600 focus:ring-yellow-300";
      } else if (currentStatus === 'ACCEPTED') {
          // --- User Requested Text for ACCEPTED (with updated label 'Pickup Date') ---
          // FormatButtonDate (Jaise: Nov 15)
          buttonText = `Accepted (Pickup Date: ${formatButtonDate(item.availableAfter)})`; 
          buttonClass = "bg-green-500 hover:bg-green-600 focus:ring-green-300";
      } else if (currentStatus === 'UNAVAILABLE') {
          // --- User Requested Text for UNAVAILABLE ---
          buttonText = "Unavailable (Currently In Use)"; 
          buttonClass = "bg-red-500 hover:bg-red-600 focus:ring-red-300";
      } else {
           buttonText = "Status: Unknown";
           buttonClass = "bg-gray-500 hover:bg-gray-600 focus:ring-gray-300"; 
      }
  }
  
  // Button styling (interactive)
  buttonClass += " shadow-md hover:shadow-lg focus:ring-4 transform active:scale-[0.99]";
  
  const DynamicIcon = showStatusMenu ? ChevronUp : ChevronDown;

  return (
    <div className="p-3 pt-2 relative border-t border-gray-100"> 
      {/* Dropdown menu */}
      {showStatusMenu &&
        <StatusDropdown 
          item={item} 
          onStatusChange={updateItemStatus} 
          toggleMenu={toggleMenu} 
        />
      }
      <button
        onClick={toggleMenu} 
        className={`w-full py-2.5 text-white text-sm font-semibold transition duration-200 rounded-lg
                    flex justify-center items-center ${buttonClass}`}
      >
          {buttonText}
          <DynamicIcon className="w-4 h-4 ml-2 text-white" /> 
      </button>
    </div>
  );
};

// --- Helper Component: Reserved Item Footer (FOR RESERVED ITEMS - read-only button) ---
const ReservedItemFooter = ({ item }) => {
    // Yeh component sirf Reserved Items (IDs 1-4) ke liye render hoga. No interaction.
    const currentStatus = item.status;
    let buttonText = "";
    let buttonClass = "";

    if (currentStatus === 'PENDING') {
        buttonText = "Pending Approval (In Action)";
        buttonClass = "bg-yellow-600 focus:ring-yellow-300";
    } else if (currentStatus === 'ACCEPTED') {
        // Reserved section mein bhi date format update kar diya hai
        buttonText = `Accepted (Pickup Date: ${formatButtonDate(item.availableAfter)})`;
        buttonClass = "bg-green-600 focus:ring-green-300";
    } else if (currentStatus === 'UNAVAILABLE') {
        buttonText = "Unavailable (Currently In Use)";
        buttonClass = "bg-red-600 focus:ring-red-300";
    } else {
         buttonText = "Status: Reserved";
         buttonClass = "bg-gray-600 focus:ring-gray-300";
    }

    // Styling: Fixed button, no hover effects, no cursor change
    buttonClass += " shadow-md opacity-90 cursor-default"; 

    return (
        <div className="p-3 pt-2 border-t border-gray-100">
            <div
                // Button tag ki jagah div use kiya gaya hai taki koi click event na ho
                className={`w-full py-2.5 text-white text-sm font-semibold transition duration-200 rounded-lg
                            flex justify-center items-center ${buttonClass}`}
            >
                {buttonText}
            </div>
        </div>
    );
};


// --- Main Card Component: CardContent (Card ka main body) ---
const CardContent = ({ item }) => {
    
  // Status check karne ke liye
  const isAvailableStatus = item.status === 'AVAILABLE';
  const isReservedStatus = item.status !== 'AVAILABLE'; // PENDING, ACCEPTED, UNAVAILABLE
  
  // Status Badge Component
  const StatusBadge = () => {
    let text = "Available";
    let Icon = CheckCircle; 
    let color = "text-green-600";
    
    if (item.status === 'PENDING') {
        text = "Reserved (Pending)";
        Icon = Clock; 
        color = "text-yellow-600";
    } else if (item.status === 'ACCEPTED') {
        text = "Reserved (Accepted)";
        Icon = CheckCircle; 
        color = "text-green-600";
    } else if (item.status === 'UNAVAILABLE') {
        text = "Reserved (Unavailable)";
        Icon = XCircle; 
        color = "text-red-600";
    } else {
        // AVAILABLE
        text = "Available";
        Icon = CheckCircle;
        color = "text-green-600";
    }


    return (
        <span className={`flex items-center text-xs font-semibold ${color}`}>
            <div className="p-0.5 rounded-full bg-white mr-1.5">
                <Icon className="w-3 h-3" />
            </div>
            {text}
        </span>
    );
  };
  
  return (
    <div className="flex flex-col flex-grow bg-white rounded-xl">
      {/* 1. TOP HEADER BLOCK (Image Carousel) */}
      <ImageCarousel item={item} category={item.category} status={item.status} images={item.images} />

      {/* 2. MAIN CONTENT AREA (Padded and Styled) */}
      <div className="px-4 pt-3 pb-3 flex flex-col flex-grow">
        
        {/* ROW 1: STATUS BADGE and RATING */}
        <div className="flex justify-between items-center mb-2">
            <StatusBadge />
            <StarRating rating={item.rating} />
        </div>
        
        {/* ROW 2: ITEM NAME */}
        <h2 className="text-base font-bold text-gray-900 truncate mb-1" title={item.name}>
            {item.name}
        </h2>
        
        {/* ROW 3: CATEGORY TAG and SHORT DESCRIPTION */}
        <span className="text-xs font-semibold text-violet-600 mb-2 border-b border-violet-100 pb-1 inline-block w-fit">
            {item.categoryTag}
        </span>
        
        {/* Description ki line-clamp ko 1 se 2 kiya gaya hai (Card ko lamba karne ke liye) */}
        <p className="text-gray-500 text-sm mb-3 line-clamp-2 min-h-[2.5rem] flex-grow">
            {item.description}
        </p>

        {/* ROW 4: OWNER & CONDITION */}
        <div className="space-y-1 mb-2 border-t border-gray-100 pt-2">
          <p className="text-gray-600 flex items-center text-sm">
            <User className="w-4 h-4 mr-2 text-gray-400" />
            <span className="text-gray-700 font-medium">{item.owner}</span>
            <span className="text-blue-600 ml-1 text-xs">({item.handle})</span>
          </p>
          
          <p className="text-gray-600 flex items-center text-sm">
             <Zap className="w-4 h-4 mr-2 text-gray-400" />
             Condition: <span className="ml-1 font-semibold text-red-600">{item.condition}</span>
          </p>
        </div>
        
        {/* ROW 5: AVAILABILITY DATE/CUSTOM STATUS */}
        <div className="mt-auto pt-1">
            {/* Ab sirf check karenge ki item reserved status mein hai aur uske paas availableAfter date hai */}
            {isReservedStatus && item.availableAfter ? (
                 <p className="flex items-center text-sm text-gray-600">
                    <Clock className="w-4 h-4 mr-2 text-yellow-500" />
                    <span className="text-yellow-700 font-medium">Reserved | after: {formatButtonDate(item.availableAfter)}</span>
                </p>
            ) : (isAvailableStatus && item.availableUntil) ? (
                <p className="flex items-center text-sm text-gray-600">
                    <Clock className="w-4 h-4 mr-2 text-green-500" />
                    <span className="text-green-700 font-medium">Available until: {formatButtonDate(item.availableUntil)}</span>
                </p>
            ) : null}
            
        </div>
        
      </div>
    </div>
  );
};

// --- Mock Data (Self-contained running ke liye) ---
const initialRequestableItems = [
  // --- Section 1: Reserved/In-Use Items (4 CARDS) ---
  { 
    id: 1, 
    name: "Scientific Calculator", 
    owner: "Rahul Sharma", 
    handle: "@rahuls", 
    condition: "Good", 
    status: "PENDING", 
    rating: 4.5, 
    category: "CALCULATOR", 
    categoryTag: "Gadgets", 
    description: "Advanced graphing calculator for engineering students with complex functions. High-resolution display and solar charging.", 
    availableAfter: "2025-10-28", 
    images: [
        "https://placehold.co/500x300/6B7280/ffffff?text=CALCULATOR+1", 
        "https://placehold.co/500x300/6B7280/ffffff?text=CALCULATOR+2",
        "https://placehold.co/500x300/6B7280/ffffff?text=CALCULATOR+3"
    ], 
    userRequestStatus: "Request Sent" 
  },
  { 
    id: 2, 
    name: "JavaScript Book", 
    owner: "Sneha Gupta", 
    handle: "@snehag", 
    condition: "Used", 
    status: "ACCEPTED", 
    rating: 5.0, 
    category: "JS BOOK", 
    categoryTag: "Books", 
    description: "A comprehensive guide to ES6 and modern JavaScript. Covers asynchronous programming and React basics.", 
    availableAfter: "2025-11-15", 
    images: [
        "https://placehold.co/500x300/3B82F6/ffffff?text=JS+BOOK+1",
        "https://placehold.co/500x300/3B82F6/ffffff?text=JS+BOOK+2",
        "https://placehold.co/500x300/3B82F6/ffffff?text=JS+BOOK+3",
    ],
    userRequestStatus: "Pickup Ready (15-Nov-2025)"
  },
  { 
    id: 3, 
    name: "HDMI Cable (5m)", 
    owner: "Amit Verma", 
    handle: "@amitv", 
    condition: "New", 
    status: "UNAVAILABLE", 
    rating: 4.0, 
    category: "HDMI CABLE", 
    categoryTag: "Accessories", 
    description: "High-speed 4K compatible HDMI cable. Supports Ethernet and 3D. Perfect for gaming consoles and PCs.", 
    availableAfter: "2025-12-05", 
    images: [
        "https://placehold.co/500x300/A855F7/ffffff?text=HDMI+CABLE+1",
        "https://placehold.co/500x300/A855F7/ffffff?text=HDMI+CABLE+2",
        "https://placehold.co/500x300/A855F7/ffffff?text=HDMI+CABLE+3",
        "https://placehold.co/500x300/A855F7/ffffff?text=HDMI+CABLE+4"
    ], 
    userRequestStatus: "Item is currently with another user" 
  },
   { 
    id: 4, 
    name: "Drawing Tablet Pro", 
    owner: "Karan Patel", 
    handle: "@karanp", 
    condition: "Excellent", 
    status: "PENDING", 
    rating: 4.6, 
    category: "DIGITAL ART", 
    categoryTag: "Hardware", 
    description: "High-precision drawing tablet for professional use with pressure sensitivity. Includes stylus and extra nibs.", 
    availableAfter: "2025-12-25", 
    images: [
        "https://placehold.co/500x300/059669/ffffff?text=TABLET+1", 
        "https://placehold.co/500x300/059669/ffffff?text=TABLET+2"
    ], 
    userRequestStatus: "Request Sent"
  },
  
  { 
    id: 5, 
    name: "Advanced React Patterns", 
    owner: "Priya Singh", 
    handle: "@priya_s", 
    condition: "Good", 
    status: "AVAILABLE", 
    rating: 4.7, 
    category: "PROGRAMMING", 
    categoryTag: "Books", 
    description: "Book on modern React development techniques and advanced hooks. Essential for intermediate developers.", 
    availableUntil: "2025-11-25", 
    images: [
        "https://placehold.co/500x300/10B981/ffffff?text=REACT+BOOK+1", 
        "https://placehold.co/500x300/10B981/ffffff?text=REACT+BOOK+2",
        "https://placehold.co/500x300/10B981/ffffff?text=REACT+BOOK+3"
    ], 
  },
  { 
    id: 6, 
    name: "External Monitor", 
    owner: "Priya Sharma", 
    handle: "@priya_s", 
    condition: "Excellent", 
    status: "AVAILABLE", 
    rating: 5.0, 
    category: "MONITOR", 
    categoryTag: "Electronics", 
    description: "27-inch 4K monitor with adjustable stand and USB-C connectivity. Ideal for graphic design.", 
    availableUntil: "2025-10-20", 
    images: [
        "https://placehold.co/500x300/9333ea/ffffff?text=MONITOR+1", 
        "https://placehold.co/500x300/9333ea/ffffff?text=MONITOR+2",
        "https://placehold.co/500x300/9333ea/ffffff?text=MONITOR+3"
    ], 
  },
  { 
    id: 7, 
    name: "Introduction to Algorithms", 
    owner: "Jane Doe", 
    handle: "@janedoe", 
    condition: "Good", 
    status: "AVAILABLE", 
    rating: 4.8, 
    category: "ALGORITHMS", 
    categoryTag: "Books", 
    description: "A classic text for computer science students covering all major algorithms and data structures.", 
    availableUntil: "2025-11-20", 
    images: [
        "https://placehold.co/500x300/3B82F6/ffffff?text=ALGO+1",
        "https://placehold.co/500x300/3B82F6/ffffff?text=ALGO+2"
    ], 
  },
  { 
    id: 8, 
    name: "Python Programming Ref.", 
    owner: "Sneha G.", 
    handle: "@snehag", 
    condition: "Used", 
    status: "AVAILABLE", 
    rating: 4.7, 
    category: "PYTHON", 
    categoryTag: "Books", 
    description: "Quick reference guide for Python syntax and libraries. Great for quick lookups on the fly.", 
    availableUntil: "2025-11-10", 
    images: [
        "https://placehold.co/500x300/EA580C/ffffff?text=PYTHON+1",
        "https://placehold.co/500x300/EA580C/ffffff?text=PYTHON+2"
    ], 
  },
  { 
    id: 9, 
    name: "Data Structures Handbook", 
    owner: "Ankit K.", 
    handle: "@ankitk", 
    condition: "Excellent", 
    status: "AVAILABLE", 
    rating: 4.9, 
    category: "ALGORITHMS", 
    categoryTag: "Books", 
    description: "Concise guide for quickly revising array, list, and tree structures. Must-have for interviews.", 
    availableUntil: "2025-12-01", 
    images: [
        "https://placehold.co/500x300/F59E0B/ffffff?text=DS+BOOK+1",
        "https://placehold.co/500x300/F59E0B/ffffff?text=DS+BOOK+2"
    ], 
  },
  { 
    id: 10, 
    name: "Ergonomic Mouse (Ergo)", 
    owner: "Bhavna R.", 
    handle: "@bhavnar", 
    condition: "New", 
    status: "AVAILABLE", 
    rating: 4.2, 
    category: "MOUSE", 
    categoryTag: "Accessories", 
    description: "Ergonomic wireless mouse with rechargeable battery and silent click feature. Perfect for long working hours.", 
    availableUntil: "2025-12-15",
    images: [
        "https://placehold.co/500x300/10B981/ffffff?text=MOUSE+1", 
        "https://placehold.co/500x300/10B981/ffffff?text=MOUSE+2"
    ], 
  },
  { 
    id: 11, 
    name: "USB-C Hub (7-in-1)", 
    owner: "Chirag D.", 
    handle: "@chiragd", 
    condition: "Good", 
    status: "AVAILABLE", 
    rating: 4.4, 
    category: "ADAPTER", 
    categoryTag: "Gadgets", 
    description: "High-quality adapter supporting 4K resolution. Required for connecting new laptops to old monitors.", 
    availableUntil: "2025-11-04",
    images: [
        "https://placehold.co/500x300/EC4899/ffffff?text=ADAPTER+1",
        "https://placehold.co/500x300/EC4899/ffffff?text=ADAPTER+2",
        "https://placehold.co/500x300/EC4899/ffffff?text=ADAPTER+3"
    ],
  },
  { 
    id: 12, 
    name: "Deep Learning Textbook", 
    owner: "Divya M.", 
    handle: "@divyam", 
    condition: "Used", 
    status: "AVAILABLE", 
    rating: 4.8, 
    category: "PROGRAMMING", 
    categoryTag: "Books", 
    description: "Standard university textbook covering neural networks, CNNs, and RNNs. Essential foundation knowledge.", 
    availableUntil: "2025-11-30", 
    images: [
        "https://placehold.co/500x300/4F46E5/ffffff?text=DL+BOOK+1", 
        "https://placehold.co/500x300/4F46E5/ffffff?text=DL+BOOK+2"
    ], 
  },
  
  { 
    id: 13, 
    name: "Mechanical Keyboard", 
    owner: "Esha S.", 
    handle: "@esha_s", 
    condition: "Excellent", 
    status: "AVAILABLE", 
    rating: 4.9, 
    category: "KEYBOARD", 
    categoryTag: "Hardware", 
    description: "Full-sized mechanical keyboard with blue switches. Ideal for typing and programming.", 
    availableUntil: "2025-12-20", 
    images: [
        "https://placehold.co/500x300/1F2937/ffffff?text=KEYBOARD+1", 
        "https://placehold.co/500x300/1F2937/ffffff?text=KEYBOARD+2"
    ], 
  },
  { 
    id: 14, 
    name: "Networking Basics Book", 
    owner: "Farhan Z.", 
    handle: "@farhan_z", 
    condition: "Good", 
    status: "AVAILABLE", 
    rating: 4.3, 
    category: "NETWORKING", 
    categoryTag: "Books", 
    description: "Introductory book covering TCP/IP, subnets, and network security essentials.", 
    availableUntil: "2025-11-18", 
    images: [
        "https://placehold.co/500x300/0891b2/ffffff?text=NET+BOOK+1", 
        "https://placehold.co/500x300/0891b2/ffffff?text=NET+BOOK+2"
    ], 
  },
  { 
    id: 15, 
    name: "External Hard Drive (1TB)", 
    owner: "Geeta P.", 
    handle: "@geeta_p", 
    condition: "New", 
    status: "AVAILABLE", 
    rating: 4.6, 
    category: "STORAGE", 
    categoryTag: "Gadgets", 
    description: "Portable 1TB SSD external hard drive with USB 3.0 interface for fast data transfer.", 
    availableUntil: "2025-12-08", 
    images: [
        "https://placehold.co/500x300/B91C1C/ffffff?text=HDD+1", 
        "https://placehold.co/500x300/B91C1C/ffffff?text=HDD+2",
    ], 
  },
  { 
    id: 16, 
    name: "Webcam Full HD 1080p", 
    owner: "Harsh V.", 
    handle: "@harsh_v", 
    condition: "Used", 
    status: "AVAILABLE", 
    rating: 4.5, 
    category: "WEBCAM", 
    categoryTag: "Electronics", 
    description: "High-quality webcam with built-in microphone and auto-focus for clear video calls.", 
    availableUntil: "2025-11-28", 
    images: [
        "https://placehold.co/500x300/059669/ffffff?text=WEBCAM+1", 
        "https://placehold.co/500x300/059669/ffffff?text=WEBCAM+2"
    ], 
  },
];

const UPPER_SECTION_IDS = [1, 2, 3, 4]; 


const App = () => {
  const [items, setItems] = useState(initialRequestableItems);

  const updateItemStatus = useCallback((id, newStatus, newDate = null) => {
    setItems(prevItems => 
        prevItems.map(item => 
            item.id === id 
                ? { 
                    ...item, 
                    status: newStatus,
                    availableAfter: newStatus === 'ACCEPTED' ? newDate : (newStatus === 'AVAILABLE' ? null : item.availableAfter),
                    userRequestStatus: newStatus === 'PENDING' ? "Request Sent" : (newStatus === 'AVAILABLE' ? null : item.userRequestStatus)
                } 
                : item
        )
    );
    console.log(`Status updated for Item ID ${id} to: ${newStatus} (Available After: ${newDate})`);
  }, []);

  
  const reservedItems = items.filter(item => UPPER_SECTION_IDS.includes(item.id)); 
  
  const availableItems = items.filter(item => !UPPER_SECTION_IDS.includes(item.id)); 

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 md:px-8 lg:px-16" style={{ fontFamily: "Inter, sans-serif" }}>

      {reservedItems.length > 0 && (
          <section className="mb-20 mx-auto"> 
              <h2 className="text-3xl font-bold text-gray-800 mb-10 text-center py-4 px-6 
                             bg-orange-50/70 rounded-xl shadow-xl border-l-8 border-orange-500 
                             transition duration-300 hover:shadow-2xl">
                  Items in Action (Pending, Accepted, Unavailable)
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-7 mx-auto">
                  {reservedItems.map((item) => (
                      <div
                          key={item.id}
                          className="bg-white rounded-xl shadow-lg overflow-hidden flex flex-col transform transition duration-300 hover:shadow-2xl hover:translate-y-[-2px]"
                      >
                          <CardContent item={item} />
                          
                          <ReservedItemFooter item={item} />
                      </div>
                  ))}
              </div>
          </section>
      )}
      
      {availableItems.length > 0 && (
          <section>
              <h2 className="text-3xl font-bold text-violet-800 mb-10 text-center py-4 px-6 
                             bg-violet-50/70 rounded-xl shadow-xl border-b-4 border-violet-600 
                             transition duration-300 hover:shadow-2xl">
                  Users Request (Update the Status)
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-7 mx-auto">
                   {availableItems.map((item) => (
                      <div
                          key={item.id}
                          className="bg-white rounded-xl shadow-lg overflow-hidden flex flex-col transform transition duration-300 hover:shadow-2xl hover:translate-y-[-2px]"
                      >
                          <CardContent item={item} />
                          
                          <ItemActionFooter item={item} updateItemStatus={updateItemStatus} />
                      </div>
                  ))}
              </div>
          </section>
      )}
      
    </div>
  );
};

export default App;
