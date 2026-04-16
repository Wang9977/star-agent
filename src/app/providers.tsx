"use client";

import { CopilotKit } from "@copilotkit/react-core";
import "@copilotkit/react-ui/styles.css";
import type { ReactNode } from "react";

type ProvidersProps = {
  children: ReactNode;
  threadId?: string;
};

export default function Providers({ children, threadId }: ProvidersProps) {
  return (
    <CopilotKit runtimeUrl="/api/copilotkit" threadId={threadId}>
      {children}
    </CopilotKit>
  );
}
