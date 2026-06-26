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

  const renderTab = () => {
    switch (activeTab) {
      case "listings": return <TabListings />;
      case "add": return <TabAddListing user={user} />;
      case "channels": return <TabChannels />;
      case "analytics": return <TabAnalytics />;
      case "profile": return <TabProfile user={user} onLogout={() => setUser(null)} />;
      default: return <TabListings />;
    }
  };

  return (
    <>
      <AppShell 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
        onOpenAi={() => setIsAiOpen(true)}
        user={user}
      >
        {renderTab()}
      </AppShell>
      <AiAssistant isOpen={isAiOpen} onClose={() => setIsAiOpen(false)} />
    </>
  );
}
