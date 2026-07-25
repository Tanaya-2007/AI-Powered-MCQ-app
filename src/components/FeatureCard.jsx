import React from "react";

function FeatureCard({ icon, title, description, index = 0 }) {
  // Color schemes with gradients (light and dark variants)
  const colorSchemes = [
    { 
      iconBg: "from-blue-500 to-cyan-500",
      cardGradient: "from-blue-50/80 to-cyan-50/60 dark:from-slate-900/50 dark:to-slate-800/40",
      accent: "from-blue-400 to-cyan-400",
    },
    { 
      iconBg: "from-purple-500 to-pink-500",
      cardGradient: "from-purple-50/80 to-pink-50/60 dark:from-slate-900/50 dark:to-slate-800/40",
      accent: "from-purple-400 to-pink-400",
    },
    { 
      iconBg: "from-pink-500 to-rose-500",
      cardGradient: "from-pink-50/80 to-rose-50/60 dark:from-slate-900/50 dark:to-slate-800/40",
      accent: "from-pink-400 to-rose-400",
    },
    { 
      iconBg: "from-indigo-500 to-purple-500",
      cardGradient: "from-indigo-50/80 to-purple-50/60 dark:from-slate-900/50 dark:to-slate-800/40",
      accent: "from-indigo-400 to-purple-400",
    },
    { 
      iconBg: "from-cyan-500 to-blue-500",
      cardGradient: "from-cyan-50/80 to-blue-50/60 dark:from-slate-900/50 dark:to-slate-800/40",
      accent: "from-cyan-400 to-blue-400",
    },
    { 
      iconBg: "from-violet-500 to-purple-500",
      cardGradient: "from-violet-50/80 to-purple-50/60 dark:from-slate-900/50 dark:to-slate-800/40",
      accent: "from-violet-400 to-purple-400",
    },
  ];

  const colors = colorSchemes[index % colorSchemes.length];

  return (
    <div className="group relative h-full">
      {/* Neumorphic card with dark mode shadow settings */}
      <div 
        className={`relative h-full bg-[#E8EDF2] dark:bg-slate-900/80 backdrop-blur-md rounded-3xl p-8 transition-all duration-500 group-hover:-translate-y-1.5 overflow-hidden border border-slate-200/50 dark:border-slate-800 shadow-xl group-hover:shadow-2xl dark:shadow-slate-950/60`}
      >
        {/* Gradient overlay */}
        <div className={`absolute inset-0 bg-gradient-to-br ${colors.cardGradient} opacity-100 transition-opacity duration-500 rounded-3xl`}></div>
        
        {/* Content */}
        <div className="relative z-10">
          {/* Icon */}
          <div className="mb-6">
            <div 
              className={`inline-flex p-4 rounded-2xl bg-gradient-to-br ${colors.iconBg} transition-all duration-500 group-hover:scale-110 shadow-lg`}
            >
              <div className="text-white">
                {React.cloneElement(icon, { className: "w-7 h-7" })}
              </div>
            </div>
          </div>
          
          {/* Title */}
          <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-4 transition-colors duration-300">
            {title}
          </h3>
          
          {/* Description */}
          <p className="text-slate-600 dark:text-slate-350 leading-relaxed mb-6 text-base transition-colors duration-300">
            {description}
          </p>

          {/* Accent line */}
          <div className={`h-1.5 bg-gradient-to-r ${colors.accent} rounded-full`} style={{ width: '60px' }}></div>
        </div>

        {/* Decorative corner element */}
        <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${colors.iconBg} opacity-10 group-hover:opacity-15 transition-opacity duration-500 rounded-bl-full`}></div>
      </div>
    </div>
  );
}

export default FeatureCard;