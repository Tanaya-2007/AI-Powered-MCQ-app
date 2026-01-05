import React from "react";

function FeatureCard({ icon, title, description }) {
  return (
    <div className="group relative bg-white rounded-2xl border-2 border-gray-200 md:border-gray-200 border-purple-300 p-6 md:p-8 md:hover:border-purple-300 transition-all duration-300 transform md:hover:scale-105 md:hover:shadow-2xl md:hover:shadow-purple-100 shadow-2xl shadow-purple-100 scale-105 md:scale-100">
      {/* Gradient overlay - visible on mobile, hover on desktop */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-purple-50/50 to-pink-50/50 rounded-2xl opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300"></div>
      
      {/* Decorative corner element - visible on mobile, hover on desktop */}
      <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-100 to-transparent rounded-bl-full opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300"></div>
      
      <div className="relative z-10">
        {/* Icon with enhanced styling */}
        <div className="inline-flex p-4 rounded-xl bg-gradient-to-br from-blue-100 to-purple-100 md:from-blue-50 md:to-purple-50 md:group-hover:from-blue-100 md:group-hover:to-purple-100 transition-all duration-300 shadow-md md:shadow-sm md:group-hover:shadow-md">
          <div className="text-purple-600 md:text-blue-600 md:group-hover:text-purple-600 transition-colors duration-300">
            {icon}
          </div>
        </div>
        
        {/* Title */}
        <h3 className="text-xl md:text-2xl font-bold text-purple-700 md:text-gray-900 md:group-hover:text-purple-700 mb-3 transition-colors duration-300">
          {title}
        </h3>
        
        {/* Description */}
        <p className="text-gray-700 md:text-gray-600 md:group-hover:text-gray-700 text-sm md:text-base leading-relaxed transition-colors duration-300">
          {description}
        </p>
      </div>
    </div>
  );
}

export default FeatureCard;
