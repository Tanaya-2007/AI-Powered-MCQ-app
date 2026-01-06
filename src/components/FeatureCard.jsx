import React from "react";

function FeatureCard({ icon, title, description, index = 0 }) {
  // Modern color schemes with unique gradients
  const colorSchemes = [
    { 
      iconBg: "from-blue-500 to-cyan-500",
      cardGradient: "from-blue-50/80 to-cyan-50/60",
      accent: "from-blue-400 to-cyan-400",
      border: "border-blue-200/30"
    },
    { 
      iconBg: "from-purple-500 to-pink-500",
      cardGradient: "from-purple-50/80 to-pink-50/60",
      accent: "from-purple-400 to-pink-400",
      border: "border-purple-200/30"
    },
    { 
      iconBg: "from-pink-500 to-rose-500",
      cardGradient: "from-pink-50/80 to-rose-50/60",
      accent: "from-pink-400 to-rose-400",
      border: "border-pink-200/30"
    },
    { 
      iconBg: "from-indigo-500 to-purple-500",
      cardGradient: "from-indigo-50/80 to-purple-50/60",
      accent: "from-indigo-400 to-purple-400",
      border: "border-indigo-200/30"
    },
    { 
      iconBg: "from-cyan-500 to-blue-500",
      cardGradient: "from-cyan-50/80 to-blue-50/60",
      accent: "from-cyan-400 to-blue-400",
      border: "border-cyan-200/30"
    },
    { 
      iconBg: "from-violet-500 to-purple-500",
      cardGradient: "from-violet-50/80 to-purple-50/60",
      accent: "from-violet-400 to-purple-400",
      border: "border-violet-200/30"
    },
  ];

  const colors = colorSchemes[index % colorSchemes.length];

  return (
    <div className="group relative h-full">
      {/* Glassmorphism card with gradient background */}
      <div className={`relative h-full bg-gradient-to-br ${colors.cardGradient} backdrop-blur-2xl rounded-3xl border ${colors.border} p-8 transition-all duration-500 group-hover:shadow-2xl group-hover:shadow-purple-500/20 group-hover:-translate-y-2 overflow-hidden`}>
        
        {/* Subtle inner glow */}
        <div className={`absolute inset-0 bg-gradient-to-br ${colors.cardGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl`}></div>
        
        {/* Content */}
        <div className="relative z-10">
          {/* Icon */}
          <div className="mb-6">
            <div className={`inline-flex p-4 rounded-2xl bg-gradient-to-br ${colors.iconBg} shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-500`}>
              <div className="text-white">
                {React.cloneElement(icon, { className: "w-7 h-7" })}
              </div>
            </div>
          </div>
          
          {/* Title */}
          <h3 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-gray-800 transition-colors duration-300">
            {title}
          </h3>
          
          {/* Description */}
          <p className="text-gray-600 leading-relaxed mb-6 text-base group-hover:text-gray-700 transition-colors duration-300">
            {description}
          </p>

          {/* Accent line under description */}
          <div className={`h-1 bg-gradient-to-r ${colors.accent} rounded-full transform origin-left transition-all duration-500 group-hover:scale-x-100`} style={{ width: '60px' }}></div>
        </div>

        {/* Decorative corner element */}
        <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${colors.iconBg} opacity-5 rounded-bl-full group-hover:opacity-10 transition-opacity duration-500`}></div>
      </div>
    </div>
  );
}

export default FeatureCard;