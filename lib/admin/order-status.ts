// Order workflow. Safe to import on the client.
export const orderStatuses = ["new", "confirmed", "paid", "made", "delivered", "cancelled"] as const;
export type OrderStatus = (typeof orderStatuses)[number];

export const orderStatusLabel: Record<OrderStatus, string> = {
  new: "New",
  confirmed: "Confirmed",
  paid: "Paid",
  made: "Made",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export const orderStatusHint: Record<OrderStatus, string> = {
  new: "Just arrived — check WhatsApp and confirm",
  confirmed: "Details agreed, waiting for payment",
  paid: "Money received",
  made: "Ready to deliver",
  delivered: "With the customer",
  cancelled: "Won't go ahead",
};
