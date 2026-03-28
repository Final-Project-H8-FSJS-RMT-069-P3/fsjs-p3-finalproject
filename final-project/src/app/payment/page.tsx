import PaymentCheckoutClient from "./PaymentCheckoutClient";

type PaymentPageProps = {
  searchParams: Promise<{
    amount?: string | string[];
    itemId?: string | string[];
    itemName?: string | string[];
    orderId?: string | string[];
  }>;
};

const getSingleParam = (value?: string | string[]) => {
  if (!value) {
    return undefined;
  }

  return Array.isArray(value) ? value[0] : value;
};

const toPositiveNumber = (value?: string, fallback = 249000) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

export default async function PaymentPage({ searchParams }: PaymentPageProps) {
  const params = await searchParams;

  const amount = toPositiveNumber(getSingleParam(params.amount));
  const itemId = getSingleParam(params.itemId) || "CONSULT-ONLINE";
  const itemName = getSingleParam(params.itemName) || "Konseling Online";
  const orderId = getSingleParam(params.orderId) || `ORDER-${Date.now()}`;

  return (
    <PaymentCheckoutClient
      amount={amount}
      itemId={itemId}
      itemName={itemName}
      orderId={orderId}
    />
  );
}
