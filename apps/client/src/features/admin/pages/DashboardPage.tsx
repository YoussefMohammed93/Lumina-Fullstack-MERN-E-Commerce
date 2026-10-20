import {
  ArrowUpRight,
  ChevronRight,
  CircleAlert,
  CircleDollarSign,
  MessageCircle,
  Package,
  ShoppingBag,
  TrendingUp,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/features/admin/components/PageHeader";

const palette = {
  green: { backgroundColor: "#dcfce7", color: "#15803d" },
  blue: { backgroundColor: "#dbeafe", color: "#1d4ed8" },
  violet: { backgroundColor: "#ede9fe", color: "#6d28d9" },
  amber: { backgroundColor: "#fef3c7", color: "#b45309" },
  red: { backgroundColor: "#fee2e2", color: "#b91c1c" },
};
const metrics = [
  {
    label: "Revenue",
    value: "EGP 84,520",
    detail: "+12.5% from last month",
    icon: CircleDollarSign,
    tone: palette.green,
  },
  {
    label: "Orders",
    value: "268",
    detail: "+8.2% from last month",
    icon: ShoppingBag,
    tone: palette.blue,
  },
  {
    label: "Customers",
    value: "1,429",
    detail: "+18.4% from last month",
    icon: Users,
    tone: palette.violet,
  },
  {
    label: "Products sold",
    value: "496",
    detail: "+5.7% from last month",
    icon: Package,
    tone: palette.amber,
  },
];
const storeTasks = [
  {
    count: "12",
    label: "Orders to fulfil",
    icon: ShoppingBag,
    tone: palette.amber,
    href: "/admin/orders",
  },
  {
    count: "3",
    label: "Products low in stock",
    icon: CircleAlert,
    tone: palette.red,
    href: "/admin/inventory",
  },
  {
    count: "5",
    label: "Customer messages",
    icon: MessageCircle,
    tone: palette.blue,
    href: "/admin/customers",
  },
  {
    count: "2",
    label: "Returns to review",
    icon: Package,
    tone: palette.violet,
    href: "/admin/orders",
  },
];
const orders = [
  {
    order: "#LM-2048",
    customer: "Mariam A.",
    items: "3 items",
    total: "EGP 1,840",
    status: "Paid",
    tone: palette.violet,
  },
  {
    order: "#LM-2047",
    customer: "Omar K.",
    items: "1 item",
    total: "EGP 720",
    status: "Processing",
    tone: palette.blue,
  },
  {
    order: "#LM-2046",
    customer: "Nour S.",
    items: "2 items",
    total: "EGP 1,280",
    status: "Paid",
    tone: palette.amber,
  },
  {
    order: "#LM-2045",
    customer: "Youssef M.",
    items: "4 items",
    total: "EGP 2,410",
    status: "Paid",
    tone: palette.green,
  },
];

export function DashboardPage({ userName }: { userName: string }) {
  return (
    <div className="space-y-7">
      <PageHeader
        title={`Good morning, ${userName}.`}
        description="Here's the latest from your store. You have 12 orders waiting to be fulfilled."
        action={
          <Button className="rounded-xl" asChild>
            <a href="/admin/products">
              Add product <ArrowUpRight />
            </a>
          </Button>
        }
      />
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <Card
              key={metric.label}
              className="rounded-md border-0 shadow-none ring-1 ring-foreground/8"
            >
              <CardHeader className="flex-row items-center justify-between space-y-0">
                <CardTitle className="font-sans text-sm font-semibold tracking-[0.01em] text-muted-foreground">
                  {metric.label}
                </CardTitle>
                <span
                  className="grid size-9 place-items-center rounded-xl"
                  style={metric.tone}
                >
                  <Icon className="size-4" strokeWidth={1.8} />
                </span>
              </CardHeader>
              <CardContent>
                <p className="text-[1.75rem] leading-none font-semibold tracking-tight">
                  {metric.value}
                </p>
                <p className="mt-2 flex items-center gap-1 text-xs font-medium text-muted-foreground">
                  <TrendingUp
                    className="size-3"
                    style={{ color: metric.tone.color }}
                    strokeWidth={2.25}
                  />
                  {metric.detail}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </section>
      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(280px,0.75fr)]">
        <Card className="rounded-md border-0 shadow-none ring-1 ring-foreground/8">
          <CardHeader className="flex-row items-start justify-between">
            <div>
              <CardTitle className="text-2xl sm:text-3xl">
                Revenue overview
              </CardTitle>
              <p className="mt-1 text-xs sm:text-sm font-medium text-muted-foreground">
                Last 30 days
              </p>
            </div>
            <Badge variant="secondary" className="font-semibold mt-2">
              EGP 84,520
            </Badge>
          </CardHeader>
          <CardContent>
            <div
              className="flex h-52 items-end gap-2 pt-4"
              aria-label="Revenue trend chart"
            >
              {[35, 48, 42, 58, 51, 72, 62, 76, 68, 88, 74, 94].map(
                (height, index) => (
                  <div key={index} className="flex h-full flex-1 items-end">
                    <div
                      style={{
                        height: `${height}%`,
                        backgroundColor:
                          index === 11 ? "var(--primary)" : "var(--secondary)",
                      }}
                      className="w-full rounded-t-md transition-opacity hover:opacity-70"
                    />
                  </div>
                ),
              )}
            </div>
            <div className="mt-3 flex justify-between text-[11px] font-medium text-muted-foreground">
              <span>Sep 20</span>
              <span>Sep 27</span>
              <span>Oct 4</span>
              <span>Oct 11</span>
              <span>Today</span>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-md border-0 bg-card text-card-foreground shadow-none ring-1 ring-foreground/8">
          <CardHeader className="flex-row items-start justify-between">
            <div>
              <CardTitle className="text-2xl sm:text-3xl">
                Store pulse
              </CardTitle>
              <p className="mt-1 text-xs sm:text-sm font-medium text-muted-foreground">
                Your team's to-do list
              </p>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {storeTasks.map(({ count, label, icon: Icon, tone, href }) => (
              <a
                href={href}
                key={label}
                className="flex items-center justify-between rounded-md px-2 py-2.5 transition-colors hover:bg-muted"
              >
                <span className="flex items-center gap-2.5 text-sm font-medium text-foreground">
                  <span
                    className="grid size-7 place-items-center rounded-full"
                    style={tone}
                  >
                    <Icon className="size-3.5" strokeWidth={2} />
                  </span>
                  {label}
                </span>
                <span className="flex items-center gap-2 font-serif text-2xl">
                  {count}
                  <ChevronRight className="size-4" />
                </span>
              </a>
            ))}
          </CardContent>
        </Card>
      </section>
      <Card className="rounded-md border-0 shadow-none ring-1 ring-foreground/8">
        <CardHeader className="admin-orders-header">
          <div>
            <CardTitle className="text-2xl sm:text-3xl">
              Recent orders
            </CardTitle>
            <p className="mt-1 text-xs sm:text-sm font-medium text-muted-foreground">
              Your four newest sales, ready for the next action.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="admin-orders-header__action w-full rounded-xl font-semibold"
            asChild
          >
            <a href="/admin/orders">View all</a>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2">
            {orders.map(({ order, customer, items, total, status, tone }) => (
              <a
                href="/admin/orders"
                key={order}
                className="group rounded-md border border-border bg-background p-4 transition-colors hover:bg-muted"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span
                      className="grid size-10 place-items-center rounded-full text-sm font-semibold"
                      style={tone}
                    >
                      {customer.slice(0, 1)}
                    </span>
                    <div>
                      <p className="font-semibold">{customer}</p>
                      <p className="mt-0.5 text-xs font-medium text-muted-foreground">
                        {order} · {items}
                      </p>
                    </div>
                  </div>
                  <Badge
                    className="border-0 font-semibold"
                    style={status === "Paid" ? palette.green : palette.amber}
                  >
                    {status}
                  </Badge>
                </div>
                <div className="mt-4 flex items-end justify-between border-t border-border pt-3">
                  <div>
                    <p className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                      Order total
                    </p>
                    <p className="mt-1 tabular text-lg font-semibold">
                      {total}
                    </p>
                  </div>
                  <span className="flex items-center gap-1 text-xs font-semibold text-muted-foreground transition-colors group-hover:text-foreground">
                    Open order <ChevronRight className="size-3.5" />
                  </span>
                </div>
              </a>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
