import React, { useEffect, useState } from "react";
import { Navbar } from "@/components/admin-panel/navbar";
import { motion } from "framer-motion";

interface ContentLayoutProps {
  title: string;
  children: React.ReactNode;
}

export function ContentLayout({ title, children }: ContentLayoutProps) {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading for demonstration
    setIsLoading(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [title]);

  return (
    <div className="bg-white dark:bg-zinc-900">
      <Navbar title={title} />
      <div className="container pt-8 pb-8 px-4 sm:px-8">
        {isLoading ? (
          <div className="flex justify-center items-center min-h-[60vh]">
            <div className="loader w-8 h-8 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="mx-auto px-4 py-6 md:px-6 lg:px-8"
          >
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.3 }}
              className="mb-6"
            >
            </motion.div>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.3 }}
              className="flex-1"
            >
              {children}
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
