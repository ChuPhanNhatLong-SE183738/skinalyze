'use client';

import React, { useRef, useState } from "react";
import Link from "next/link";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<number | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const menuItems = [
    {
      title: "For home use",
      href: "/",
      dropdown: [
        { title: "Skinalyze app", href: "/" },
        { title: "Skin Conditions List", href: "/" },
        { title: "Download app", href: "/app" },
      ],
    },
    {
      title: "For Clinicians",
      href: "/",
      dropdown: [
        { title: "Skinalyze MD app", href: "/staff/login" },
        { title: "Dermatological Atlas", href: "/blog" },
        { title: "Download app", href: "/app" },
      ],
    },
    {
      title: "About",
      href: "/about",
    },
    {
      title: "Blog",
      href: "/blog",
    },
    {
      title: "Support",
      href: "/contacts",
      dropdown: [
        { title: "Terms & Conditions", href: "/terms" },
        { title: "FAQ", href: "/faq" },
        { title: "Contacts", href: "/contacts" },
      ],
    },
  ];

  const handleMouseEnter = (index: number, hasDropdown: boolean) => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    if (hasDropdown) {
      setActiveDropdown(index);
    }
  };

  const handleMouseLeave = () => {
    // Set timeout to hide dropdown after delay
    timeoutRef.current = setTimeout(() => {
      setActiveDropdown(null);
      timeoutRef.current = null;
    }, 50); // Reduced to 300ms for better UX
  };

  const handleDropdownClick = () => {
    // Clear timeout and hide dropdown immediately
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setActiveDropdown(null);
  };

  const handleDropdownEnter = (index: number) => {
    // Clear timeout when entering dropdown area
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setActiveDropdown(index);
  };
  return (
    <header className="bg-white/70 backdrop-blur-xl shadow-lg border border-emerald-200/30 fixed top-4 z-50 max-w-none w-auto mx-auto left-1/2 transform -translate-x-1/2 rounded-2xl">
      <div className="px-8 lg:px-12">
        <div className="flex justify-between items-center h-18 whitespace-nowrap">
          {/* Logo */}
          <div className="flex items-center flex-shrink-0">
            <Link href="/" className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <div className="w-10 h-10 flex items-center justify-center mr-4">
                  <img
                    src="/logo.png"
                    alt="Logo"
                    className="w-10 h-10 object-contain"
                  />
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent tracking-tight whitespace-nowrap">
                  Skinalyze
                </span>
              </div>
            </Link>
          </div>
          {/* Desktop Menu */}
          <div className="hidden lg:block flex-shrink-0">
            <nav className="flex items-center space-x-4 ml-8">
              {menuItems.map((item, index) => (
                <div
                  key={index}
                  className="relative group"
                  onMouseEnter={() => handleMouseEnter(index, !!item.dropdown)}
                  onMouseLeave={handleMouseLeave}
                >
                  {" "}
                  <Link
                    href={item.href}
                    className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 hover:text-emerald-600 transition-colors duration-200 rounded-xl hover:bg-emerald-50/70 whitespace-nowrap"
                  >
                    {item.title}
                    {item.dropdown && (
                      <svg
                        className={`ml-2 w-4 h-4 transition-transform duration-200 ${
                          activeDropdown === index ? "rotate-180" : ""
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    )}
                  </Link>
                  {/* Dropdown Menu */}
                  {item.dropdown && activeDropdown === index && (
                    <div
                      className="absolute top-full left-0 mt-2 w-60 bg-white/90 backdrop-blur-xl rounded-xl shadow-xl border border-emerald-200/40 py-2 z-50"
                      onMouseEnter={() => handleDropdownEnter(index)}
                      onMouseLeave={handleMouseLeave}
                    >
                      {item.dropdown.map((dropdownItem, dropdownIndex) => (
                        <Link
                          key={dropdownIndex}
                          href={dropdownItem.href}
                          className="block px-4 py-3 text-sm text-gray-700 hover:text-emerald-600 hover:bg-emerald-50/70 transition-colors duration-200 rounded-lg mx-2 whitespace-nowrap"
                          onClick={handleDropdownClick}
                        >
                          {dropdownItem.title}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </nav>
          </div>
          {/* Right Side - Social & CTA */}
          <div className="hidden lg:flex items-center space-x-4 ml-8 flex-shrink-0">
            {/* CTA Button */}{" "}
            <Link
              href="/app"
              className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 shadow-lg hover:shadow-xl whitespace-nowrap"
            >
              <span className="hidden xl:inline">GET FREE APP</span>{" "}
              <span className="xl:hidden">GET STARTED</span>
            </Link>
          </div>{" "}
          {/* Mobile menu button */}
          <div className="lg:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-3 rounded-xl text-gray-600 hover:text-emerald-600 hover:bg-emerald-50/70 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-emerald-500 transition-colors duration-200"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {isMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="lg:hidden">
            <div className="px-4 pt-4 pb-5 space-y-3 bg-white/80 backdrop-blur-xl border-t border-emerald-200/40 rounded-b-xl mt-2">
              {menuItems.map((item, index) => (
                <div key={index}>
                  <Link
                    href={item.href}
                    className="text-gray-700 hover:text-emerald-600 block px-4 py-3 text-base font-medium transition-colors duration-200 rounded-xl hover:bg-emerald-50/70"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {item.title}
                  </Link>
                  {item.dropdown && (
                    <div className="ml-4 space-y-2 mt-2">
                      {item.dropdown.map((dropdownItem, dropdownIndex) => (
                        <Link
                          key={dropdownIndex}
                          href={dropdownItem.href}
                          className="text-gray-600 hover:text-emerald-600 block px-4 py-2 text-sm transition-colors duration-200 rounded-lg hover:bg-emerald-50/70"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          {dropdownItem.title}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {/* Mobile CTA */}
              <div className="pt-4">
                {" "}
                <Link
                  href="/app"
                  className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white block px-4 py-3 rounded-xl text-base font-semibold text-center transition-all duration-200 shadow-lg"
                  onClick={() => setIsMenuOpen(false)}
                >
                  GET FREE APP
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
