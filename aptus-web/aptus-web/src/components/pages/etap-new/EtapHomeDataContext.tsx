"use client";

import { createContext, useContext } from "react";
import { DEFAULT_ETAP_HOME_PAGE_DATA, type EtapHomePageData } from "./etap-home-types";

const EtapHomeDataContext = createContext<EtapHomePageData>(DEFAULT_ETAP_HOME_PAGE_DATA);

export function EtapHomeDataProvider({
  value,
  children,
}: {
  value: EtapHomePageData;
  children: React.ReactNode;
}) {
  return <EtapHomeDataContext.Provider value={value}>{children}</EtapHomeDataContext.Provider>;
}

export function useEtapHomeData(): EtapHomePageData {
  return useContext(EtapHomeDataContext);
}
