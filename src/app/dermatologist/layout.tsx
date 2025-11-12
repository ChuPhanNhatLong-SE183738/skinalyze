import { DermatologistProvider } from "@/contexts/DermatologistContext";

export default function DermatologistLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DermatologistProvider>{children}</DermatologistProvider>;
}
