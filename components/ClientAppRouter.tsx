"use client";

import { useState } from "react";
import { AuthScreen } from "./AuthScreen";
import { AppShell } from "./AppShell";
import { TabListings } from "./TabListings";
import { TabAddListing } from "./TabAddListing";
import { TabChannels } from "./TabChannels";
import { TabAnalytics } from "./TabAnalytics";
import { TabProfile } from "./TabProfile";
import { AiAssistant } from "./AiAssistant";

export function ClientAppRouter() {
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("listings");
  const [isAiOpen, setIsAiOpen] = useState(false);

  if (!user) {
    return <AuthScreen onLogin={(u) => setUser(u)} />;
  }

  const isInsider = !!user?.isInsider;

  const renderTab = () => {
    switch (activeTab) {
      case "listings":
        return <TabListings />;
      case "add":
        return <TabAddListing user={user} />;
      // Insider-only tabs — redirect public users to listings if they somehow reach them
      case "channels":
        return isInsider ? <TabChannels /> : <TabListings />;
      case "analytics":
        return (isInsider && user?.isManager) ? <TabAnalytics user={user} /> : <TabListings />;
      case "profile":
        return isInsider ? <TabProfile user={user} onLogout={() => { setUser(null); setActiveTab("listings"); }} /> : <TabListings />;
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
        user={user}
        isInsider={isInsider}
      >
        {renderTab()}
      </AppShell>
      <AiAssistant isOpen={isAiOpen} onClose={() => setIsAiOpen(false)} />
    </>
  );
}
