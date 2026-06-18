import { SampleReception } from "@/components/reception/SampleReception";
import { type TabKey } from "@/components/reception/ReceiptsTable";

export function ReceptionPage({ defaultTab = "incoming-requests" }: { defaultTab?: TabKey }) {
    return (
        <div className="h-full">
            <SampleReception defaultTab={defaultTab} />
        </div>
    );
}
