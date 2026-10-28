import { BlogList } from "@/components/pages/BlogList";
import type { Metadata } from "next";
import "@/styles/pages/blog.css";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Industry insights from Aptus Infotech on software, design, communications, security, and infrastructure.",
};

export default function BlogPage() {
  return (
    <div className="page-blog">
      <BlogList />
    </div>
  );
}
