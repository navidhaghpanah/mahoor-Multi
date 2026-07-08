"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Loader2 } from "lucide-react";
import { AuthScreen } from "./AuthScreen";
import { AppShell } from "./AppShell";
import { TabListings } from "./TabListings";
import { TabAddListing } from "./TabAddListing";
import { TabChannels } from "./TabChannels";
import { TabProfile } from "./TabProfile";
import { AiAssistant } from "./AiAssistant";
import { ManagerApp } from "./ManagerApp";

const SESSION_KEY = "mahoor_session";

export function ClientAppRouter() {
  const pathname = usePathname();
  const [user, setUser]           = useState<any>(null);
  const [activeTab, setActiveTab] = useState("listings");
  const [isAiOpen, setIsAiOpen]   = useState(false);
  const [sessionLoading, setSessionLoading] = useState(true);

  // On mount: restore session from localStorage if a valid signed token exists
  useEffect(() => {
    const token = localStorage.getItem(SESSION_KEY);
    if (!token) { setSessionLoading(false); return; }

    fetch(`/api/auth/me?token=${encodeURIComponent(token)}`)
      .then(r => (r.ok ? r.json() : null))
      .then(data => { if (data?.user) setUser(data.user); })
      .catch(() => {})
      .finally(() => setSessionLoading(false));
  }, []);

  const handleLogin = (u: any, sessionToken?: string) => {
    if (sessionToken) localStorage.setItem(SESSION_KEY, sessionToken);
    setUser(u);
  };

  const handleLogout = () => {
    localStorage.removeItem(SESSION_KEY);
    setUser(null);
    setActiveTab("listings");
  };

  if (pathname.startsWith('/p/')) return null;

  if (sessionLoading) {
    return (
      <div className="min-h-[100dvh] bg-[#030D1E] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#D4AF37]" />
      </div>
    );
  }

  if (!user) {
    return <AuthScreen onLogin={handleLogin} />;
  }

  if (user?.isManager) {
    return <ManagerApp user={user} onLogout={handleLogout} />;
  }

  const isInsider = !!user?.isInsider;

  const renderTab = () => {
    switch (activeTab) {
      case "listings":
        return <TabListings />;
      case "add":
        return <TabAddListing user={user} />;
      case "channels":
        return isInsider ? <TabChannels /> : <TabListings />;
      case "profile":
        return isInsider ? (
          <TabProfile user={user} onLogout={handleLogout} />
        ) : (
          <TabListings />
        );
      default:
        return <TabListings />;
    }
  };

  return (
    <>
      <AppShell
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenAi={() => setIsAiOpen(true)}
        onLogout={handleLogout}
        user={user}
        isInsider={isInsider}
      >
        {renderTab()}
      </AppShell>
      <AiAssistant isOpen={isAiOpen} onClose={() => setIsAiOpen(false)} />
    </>
  );
}
