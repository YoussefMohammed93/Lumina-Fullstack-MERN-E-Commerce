import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/features/admin/components/PageHeader";

const content: Record<
  string,
  { title: string; description: string; action?: string }
> = {
  orders: {
    title: "Orders",
    description:
      "Track payments, fulfillment, and delivery status across your store.",
  },
  products: {
    title: "Products",
    description:
      "Manage your catalog, variants, pricing, and product availability.",
    action: "Add product",
  },
  categories: {
    title: "Categories",
    description: "Organize your catalog into clear, discoverable collections.",
  },
  customers: {
    title: "Customers",
    description: "View customer profiles, order history, and lifetime value.",
  },
  journal: {
    title: "Journal",
    description: "Manage editorial stories and the storefront journal.",
  },
  newsletter: {
    title: "Newsletter",
    description: "Manage newsletter subscribers and email updates.",
  },
  notifications: {
    title: "Notifications",
    description:
      "Review all store activity, operational alerts, and customer updates.",
  },
  settings: {
    title: "Store settings",
    description:
      "Control the details that shape your customers' store experience.",
  },
};

export function ResourcePage({ page }: { page: string }) {
  const details = content[page] ?? content.orders;
  return (
    <div className="space-y-7">
      <PageHeader
        title={details.title}
        description={details.description}
        action={
          details.action ? (
            <Button className="rounded-xl">
              <Plus />
              {details.action}
            </Button>
          ) : undefined
        }
      />
      <Card className="rounded-md border-0 shadow-none ring-1 ring-foreground/8">
        <CardContent className="flex min-h-72 flex-col items-center justify-center text-center">
          <p className="font-serif text-2xl">{details.title} workspace</p>
          <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
            The page shell is ready for live {details.title.toLowerCase()} data
            and actions.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
