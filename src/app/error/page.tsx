import ErrorClient from "./ErrorClient";

export const dynamic = "force-dynamic";

export default function ErrorPage() {
  return (
    <ErrorClient
      title="Error en la transacción"
      message="Tu transacción fue rechazada, Por favor verifique su conexión o intente nuevamente."
    />
  );
}
