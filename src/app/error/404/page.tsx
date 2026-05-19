import ErrorClient from "../ErrorClient";

export const dynamic = "force-dynamic";

export default function Error404Page() {
  return (
    <ErrorClient
      title="Página no encontrada"
      message="Lo sentimos, la página que estás buscando no existe o fue movida."
    />
  );
}
