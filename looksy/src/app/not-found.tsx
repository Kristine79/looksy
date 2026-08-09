import { translate } from "@/i18n";
import { getLocale } from "@/i18n/server";

export default async function NotFoundPage() {
  const locale = await getLocale();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-2 bg-page">
      <h1 className="text-2xl font-medium tracking-tight text-ink">
        {translate(locale, "notFound.title")}
      </h1>
      <p className="text-sm text-muted">{translate(locale, "notFound.body")}</p>
    </div>
  );
}