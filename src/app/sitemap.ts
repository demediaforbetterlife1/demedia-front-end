import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
	const base = process.env.NEXT_PUBLIC_SITE_URL || "https://example.com";
	return [
		{ url: `${base}/`, changeFrequency: "daily", priority: 1.0 },
		{ url: `${base}/sign-in`, changeFrequency: "monthly", priority: 0.5 },
		{ url: `${base}/sign-up`, changeFrequency: "monthly", priority: 0.6 },
		{ url: `${base}/home`, changeFrequency: "daily", priority: 0.9 },
	];
}


