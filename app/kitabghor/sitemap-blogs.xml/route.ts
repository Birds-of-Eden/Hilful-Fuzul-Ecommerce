import { NextResponse } from "next/server";

export async function GET() {
  const res = await fetch("https://hilfulfujulbd.com/api/blogs", {
    next: { revalidate: 3600 },
  });
  const blogs = await res.json();

  const urls = blogs
    .map(
      (blog: any) => `
      <url>
        <loc>https://hilfulfujulbd.com/kitabghor/blogs/${blog.id}</loc>
        <lastmod>${new Date(blog.updatedAt).toISOString()}</lastmod>
        <changefreq>daily</changefreq>
        <priority>0.8</priority>
      </url>`
    )
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
  <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    ${urls}
  </urlset>`;

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml",
    },
  });
}
