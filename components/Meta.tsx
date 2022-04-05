import Head from "next/head"; // HTML Head

// Meta (w/ optional custom overrides)
export default function Meta({
  title,
  description,
  url,
}: {
  title?: string;
  description?: string;
  url?: string;
}) {
  // Custom overrides from page
  const siteTitle: string =
    title ?? "GateRepo - Token-gated GitHub Repositories";
  const siteDescription: string =
    description ??
    "GateRepo is a simple way to token gate access to private GitHub repositories.";
  const siteUrl: string = url ?? "https://gaterepo.com/";

  return (
    <Head>
      {/* Primary Meta Tags */}
      <title>GateRepo — Token-gated GitHub Repositories</title>
      <meta name="title" content={siteTitle} />
      <meta name="description" content={siteDescription} />

      {/* Open Graph + Facebook */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={siteUrl} />
      <meta property="og:title" content={siteTitle} />
      <meta property="og:description" content={siteDescription} />
      <meta property="og:image" content="https://gaterepo.com/meta.png" />

      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={siteUrl} />
      <meta property="twitter:title" content={siteTitle} />
      <meta property="twitter:description" content={siteDescription} />
      <meta property="twitter:image" content="https://gaterepo.com/meta.png" />

      {/* Favicon */}
      <link rel="shortcut icon" href="/favicon.ico" />
    </Head>
  );
}
