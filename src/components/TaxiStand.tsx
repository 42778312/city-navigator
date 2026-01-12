import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TaxiService } from "./TaxiService";
import taxiCompaniesData from "@/config/taxiCompanies.json";

interface TaxiStandProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function TaxiStand({ isOpen, onOpenChange }: TaxiStandProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Call a Taxi</DialogTitle>
        </DialogHeader>
        <div className="rounded-lg overflow-hidden border">
          {taxiCompaniesData.map((company, index) => (
            <TaxiService key={index} company={company} />
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
