"use client";

import React, { useMemo } from "react";
import { usePathname } from "next/navigation";

interface FooterProps {
  organizationName?: string;
  copyrightYear?: number;
  text?: React.ReactNode;
  hiddenPaths?: string[];
  hidden?: boolean;
  className?: string;
}

export function Footer({
  organizationName = "เทศบาลเมืองแสนสุข",
  copyrightYear,
  text,
  hiddenPaths = ["/u/signin", "/u/signup", "/u/forgot-password", "/u/forgot_password"],
  hidden = false,
  className = "",
}: FooterProps) {
  const pathname = usePathname();
  const year = copyrightYear ?? new Date().getFullYear() + 543;

  const isHidden = useMemo(() => {
    if (hidden) return true;
    if (!pathname) return false;
    return hiddenPaths.some((path) => {
      if (pathname === path) return true;
      if (path !== "/" && pathname.startsWith(`${path}/`)) return true;
      return false;
    });
  }, [hidden, pathname, hiddenPaths]);

  if (isHidden) {
    return null;
  }

  return (
    <footer
      className={`mt-auto py-6 border-t border-slate-200 text-center text-xs text-slate-400 bg-white ${className}`}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-center text-sm text-slate-600">
        {text || `© ${year} ตามพระราชบัญญัติลิขสิทธิ์ 2537 ${organizationName}`}
      </div>
    </footer>
  );
}

export default Footer;
