import * as React from "react";
import { AlertDialog as AlertDialogPrimitive } from "radix-ui";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const AlertDialog = AlertDialogPrimitive.Root;
const AlertDialogTrigger = AlertDialogPrimitive.Trigger;
const AlertDialogAction = AlertDialogPrimitive.Action;
const AlertDialogCancel = AlertDialogPrimitive.Cancel;
function AlertDialogContent({ className, ...props }: React.ComponentProps<typeof AlertDialogPrimitive.Content>) {
  return <AlertDialogPrimitive.Portal><AlertDialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm" /><AlertDialogPrimitive.Content className={cn("fixed top-1/2 left-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-popover p-6 shadow-xl ring-1 ring-foreground/10", className)} {...props} /></AlertDialogPrimitive.Portal>;
}
function AlertDialogHeader(props: React.ComponentProps<"div">) { return <div className="space-y-2" {...props} />; }
function AlertDialogFooter({ className, ...props }: React.ComponentProps<"div">) { return <div className={cn("mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", className)} {...props} />; }
function AlertDialogTitle(props: React.ComponentProps<typeof AlertDialogPrimitive.Title>) { return <AlertDialogPrimitive.Title className="font-serif text-2xl" {...props} />; }
function AlertDialogDescription(props: React.ComponentProps<typeof AlertDialogPrimitive.Description>) { return <AlertDialogPrimitive.Description className="text-sm leading-6 text-muted-foreground" {...props} />; }
function AlertDialogCancelButton(props: React.ComponentProps<typeof AlertDialogPrimitive.Cancel>) { return <AlertDialogPrimitive.Cancel asChild><Button variant="outline" {...props} /></AlertDialogPrimitive.Cancel>; }
function AlertDialogActionButton(props: React.ComponentProps<typeof AlertDialogPrimitive.Action>) { return <AlertDialogPrimitive.Action asChild><Button variant="destructive" {...props} /></AlertDialogPrimitive.Action>; }
export { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogFooter, AlertDialogTitle, AlertDialogDescription, AlertDialogAction, AlertDialogCancel, AlertDialogCancelButton, AlertDialogActionButton };
