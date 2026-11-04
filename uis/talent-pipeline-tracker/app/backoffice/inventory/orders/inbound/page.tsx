import OrderForm from "../../_components/order-form";

export default async function InboundPage({ searchParams }: {
  searchParams: Promise<{ product?: string }>;
}) {
  const { product } = await searchParams;
  return <OrderForm direction="inbound" initialProductId={product} />;
}