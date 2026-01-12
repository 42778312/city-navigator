import { Button } from "@/components/ui/button";

interface TaxiCompany {
  name: string;
  phone: string;
}

interface TaxiServiceProps {
  company: TaxiCompany;
}

export function TaxiService({ company }: TaxiServiceProps) {
  const handleCall = () => {
    window.location.href = `tel:${company.phone}`;
  };

  return (
    <div className="flex items-center justify-between p-4 border-b">
      <div>
        <h3 className="font-semibold">{company.name}</h3>
        <p className="text-sm text-gray-500">{company.phone}</p>
      </div>
      <Button onClick={handleCall}>Call</Button>
    </div>
  );
}
