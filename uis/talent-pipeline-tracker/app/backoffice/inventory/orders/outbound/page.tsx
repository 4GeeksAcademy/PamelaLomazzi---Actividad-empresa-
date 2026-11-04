import OrderForm from "../../_components/order-form";

export default async function OutboundPage({ searchParams }: {
  searchParams: Promise<{ product?: string }>;
}) {
  const { product } = await searchParams;
  return <OrderForm direction="outbound" initialProductId={product} />;
}