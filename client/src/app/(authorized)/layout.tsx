import { GuildsContextProvider } from "@/components/guilds-context-provider";

export default function AuthorizedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <GuildsContextProvider>
      {children}
    </GuildsContextProvider>
  );
}
