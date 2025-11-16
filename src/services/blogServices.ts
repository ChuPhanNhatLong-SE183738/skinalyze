import { GraphQLClient, gql } from "graphql-request";

class APIError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

const initializeClient = async () => {
  return new GraphQLClient(
    "https://api-ap-northeast-1.hygraph.com/v2/clwl6f2lv02gw07uym6a6ro5t/master"
  );
};

const getAllPosts = async () => {
  try {
    const graphqlClient = await initializeClient();
    const getAllPostsQuery = gql`
      {
        posts {
          id
          title
          postDate
          slug
          category
          content {
            html
          }
          author {
            userId
            name
            avatar {
              id
            }
          }
          coverPhoto
          stage
        }
      }
    `;

    const response = await graphqlClient.request(getAllPostsQuery);

    // Transform and filter published posts
    const transformedPosts = response.posts
      .filter((post: any) => post.stage === "PUBLISHED")
      .map((post: any, index: number) => ({
        id: post.id,
        title: post.title,
        excerpt:
          post.content.html
            .replace(/<[^>]*>/g, " ")
            .replace(/\s+/g, " ")
            .trim()
            .substring(0, 150) + "...",
        image:
          post.coverPhoto ||
          `https://images.unsplash.com/photo-${
            1559757148 + index
          }-5c350d0d3c56?w=600&h=400&fit=crop`,
        category: post.category || "news",
        author: post.author?.name || "Skinalyze Team",
        authorId: post.author?.userId,
        authorAvatar: post.author?.avatar?.id,
        date: new Date(post.postDate).toLocaleDateString("vi-VN", {
          year: "numeric",
          month: "short",
          day: "numeric",
        }),
        readTime: `${Math.ceil(
          post.content.html.split(" ").length / 200
        )} phút đọc`,
        featured: index < 2,
        slug: post.slug,
        content: post.content.html,
        stage: post.stage,
      }));

    return transformedPosts.reverse();
  } catch (error) {
    console.error("Error fetching posts:", error);
    throw new APIError(500, "Failed to fetch blog posts");
  }
};

const getPostBySlug = async (slug: string) => {
  try {
    const graphqlClient = await initializeClient();
    const getPostQuery = gql`
      query GetPostBySlug($slug: String!) {
        posts(where: { slug: $slug }) {
          id
          title
          postDate
          slug
          category
          content {
            html
          }
          author {
            name
            avatar {
              id
            }
          }
          coverPhoto
        }
      }
    `;
    const response = await graphqlClient.request(getPostQuery, { slug });

    if (!response.posts || response.posts.length === 0) {
      throw new APIError(404, "Blog post not found");
    }

    const post = response.posts[0];
    return {
      id: post.id,
      title: post.title,
      content: post.content.html,
      image:
        post.coverPhoto ||
        "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800&h=600&fit=crop",
      category: post.category || "news",
      author: post.author?.name || "Skinalyze Team",
      authorAvatar: post.author?.avatar?.id,
      date: new Date(post.postDate).toLocaleDateString("vi-VN", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      readTime: `${Math.ceil(
        post.content.html.split(" ").length / 200
      )} phút đọc`,
      slug: post.slug,
    };
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }
    console.error("Error fetching post by slug:", error);
    throw new APIError(500, "Failed to fetch blog post");
  }
};

const getPostsByCategory = async (category: string) => {
  try {
    const allPosts = await getAllPosts();
    return category === "all"
      ? allPosts
      : allPosts.filter((post: any) => post.category === category);
  } catch (error) {
    throw new APIError(500, "Failed to fetch posts by category");
  }
};

const getRelatedPosts = async (currentSlug: string, category: string, limit: number = 3) => {
  try {
    const allPosts = await getAllPosts();
    return allPosts
      .filter((post: any) => post.slug !== currentSlug && post.category === category)
      .slice(0, limit);
  } catch (error) {
    throw new APIError(500, "Failed to fetch related posts");
  }
};

export {
  getAllPosts,
  getPostBySlug,
  getPostsByCategory,
  getRelatedPosts,
  APIError,
};
