"use client";

import { useEffect, useState, useMemo, useCallback, memo } from "react";
import CategoryBooks from "@/components/ecommarce/category-books";
import Hero from "@/components/ecommarce/hero";
import Header from "@/components/ecommarce/header";
import Footer from "@/components/ecommarce/footer";

type Category = {
  id: number;
  name: string;
  productCount: number;
  // baki field thakle ichha moto add korte paro
};

type Product = {
  id: number;
  name: string;
  category: { id: number; name: string };
  price: number;
  original_price: number;
  discount: number;
  writer: { id: number; name: string };
  publisher: { id: number; name: string };
  image: string;
  stock?: number;
  available?: boolean;
  deleted?: boolean;
};

interface RatingInfo {
  averageRating: number;
  totalReviews: number;
}

// Create a context-like data provider component
const DataProvider = memo(function DataProvider({
  children,
}: {
  children: (data: {
    categories: Category[];
    allProducts: Product[];
    ratings: Record<string, RatingInfo>;
    loading: boolean;
    error: string | null;
  }) => React.ReactNode;
}) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [ratings, setRatings] = useState<Record<string, RatingInfo>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 🔹 Fetch all data once with caching
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch categories
        const categoriesRes = await fetch("/api/categories", {
          cache: "force-cache",
          next: { revalidate: 600 }, // Cache for 10 minutes
        });

        if (!categoriesRes.ok) {
          throw new Error("Failed to fetch categories");
        }

        const categoriesData: Category[] = await categoriesRes.json();

        // Fetch products once
        const productsRes = await fetch("/api/products", {
          cache: "force-cache",
          next: { revalidate: 300 }, // Cache for 5 minutes
        });

        if (!productsRes.ok) {
          throw new Error("Failed to fetch products");
        }

        const productsData: Product[] = await productsRes.json();

        // Fetch ratings for first 20 products only (optimization)
        const productIds = productsData.slice(0, 20).map((p) => p.id);

        const ratingResults = await Promise.all(
          productIds.map(async (id) => {
            try {
              const ratingRes = await fetch(
                `/api/reviews?productId=${id}&page=1&limit=1`,
                { cache: "force-cache" }
              );

              if (!ratingRes.ok) {
                return { id, avg: 0, total: 0 };
              }

              const ratingData = await ratingRes.json();
              return {
                id,
                avg: Number(ratingData.averageRating ?? 0),
                total: Number(ratingData.pagination?.total ?? 0),
              };
            } catch (err) {
              console.error(`Error fetching rating for product ${id}:`, err);
              return { id, avg: 0, total: 0 };
            }
          })
        );

        const ratingsMap: Record<string, RatingInfo> = {};
        ratingResults.forEach(({ id, avg, total }) => {
          ratingsMap[String(id)] = {
            averageRating: avg,
            totalReviews: total,
          };
        });

        setCategories(categoriesData);
        setAllProducts(productsData);
        setRatings(ratingsMap);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Data load korte problem hocche");
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, []);

  // Memoized value to pass to children
  const value = useMemo(
    () => ({
      categories,
      allProducts,
      ratings,
      loading,
      error,
    }),
    [categories, allProducts, ratings, loading, error]
  );

  // Pass data via context or props (using props for simplicity)
  return <>{children(value)}</>;
});

DataProvider.displayName = "DataProvider";

export default function Home() {
  return (
    <div className="w-full">
      <div className="min-h-screen flex flex-col">
        <Header />
        <Hero />
        <DataProvider>
          {(data: {
            categories: Category[];
            allProducts: Product[];
            ratings: Record<string, RatingInfo>;
            loading: boolean;
            error: string | null;
          }) => (
            <div className="container mx-auto py-12 px-4">
              {data.loading && <p>Loading categories...</p>}
              {data.error && <p className="text-red-500">{data.error}</p>}
              {!data.loading &&
                !data.error &&
                data.categories.map((category) => (
                  <CategoryBooks
                    key={category.id}
                    category={category}
                    allProducts={data.allProducts}
                    ratings={data.ratings}
                  />
                ))}
            </div>
          )}
        </DataProvider>
        <Footer />
      </div>
    </div>
  );
}
