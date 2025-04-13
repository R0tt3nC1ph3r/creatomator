import CampaignForm from "@/components/campaign-form";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-black">Welcome to Creatomator Uploader</h1>
      <p className="text-sm text-muted-foreground">
        Start by uploading creatives, adding campaign info, and exporting to your Excel template.
      </p>

      <CampaignForm />
    </div>
  );
}
