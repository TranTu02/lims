import type { ReactNode } from "react";
import { ClientCreateModal } from "./ClientCreateModal";
import { OrderCreateModal } from "./OrderCreateModal";
import { QuoteCreateModal } from "./QuoteCreateModal";


type CrmTab = "clients" | "orders" | "quotes";

type Props = {
  open: boolean;
  tab: CrmTab;
  onClose: () => void;
};

export function CrmCreateModalHost({ open, tab, onClose }: Props): ReactNode {
  if (tab === "clients") return <ClientCreateModal open={open} onClose={onClose} />;
  if (tab === "orders") return <OrderCreateModal open={open} onClose={onClose} />;
  return <QuoteCreateModal open={open} onClose={onClose} />;
}
