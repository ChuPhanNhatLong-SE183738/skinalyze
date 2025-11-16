'use client'
import React from "react";
import Navbar from "@/components/navbar/Navbar";
import BlogDetail from "@/components/blogdetail/BlogDetail";

interface BlogDetailPageProps {
  params: {
    slug: string;
  };
}

const BlogDetailPage = ({ params }: BlogDetailPageProps) => {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <BlogDetail slug={params.slug} />
    </div>
  );
};

export default BlogDetailPage;
