import { useState, useEffect, useMemo } from "react";
import { fetchProducts } from "./services/api";
import type { Product } from "./types/product";

// shadcn UI Components
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";

// Lucide Icons
import {
  Sparkles,
  Search,
  X,
  Heart,
  ShoppingBag,
  Eye,
  Plus,
  Star,
  AlertCircle,
  RefreshCw,
  Package,
  Layers,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";

export function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filter & Search states
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Cart & Wishlist state
  const [cartCount, setCartCount] = useState<number>(0);
  const [wishlist, setWishlist] = useState<Set<string>>(new Set());

  // Interactive modal & notification states
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Fetch products from API on mount
  const loadProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchProducts();
      setProducts(data);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Could not connect to backend API";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  // Compute unique categories dynamically from the products data
  const categories = useMemo(() => {
    const unique = Array.from(new Set(products.map((p) => p.category))).filter(
      Boolean
    );
    return ["All", ...unique];
  }, [products]);

  // Compute filtered products based on category and search query
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesCategory =
        selectedCategory === "All" ||
        product.category.toLowerCase() === selectedCategory.toLowerCase();

      const query = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !query ||
        product.name.toLowerCase().includes(query) ||
        product.description.toLowerCase().includes(query) ||
        product.category.toLowerCase().includes(query) ||
        product.slug.toLowerCase().includes(query);

      return matchesCategory && matchesSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  // Wishlist toggle
  const toggleWishlist = (productId: string) => {
    setWishlist((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) {
        next.delete(productId);
        showToast("Removed from wishlist");
      } else {
        next.add(productId);
        showToast("Saved to wishlist");
      }
      return next;
    });
  };

  // Add to cart with visual feedback
  const handleAddToCart = (product: Product) => {
    setCartCount((c) => c + 1);
    showToast(`Added "${product.name}" to cart!`);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  };

  // Star rating helper
  const renderStars = (rating: number) => {
    const full = Math.floor(rating);
    const hasHalf = rating % 1 >= 0.4;
    return (
      <div
        className="flex items-center gap-1 text-amber-500"
        title={`${rating} out of 5 stars`}
      >
        <div className="flex items-center">
          {Array.from({ length: 5 }).map((_, i) => {
            if (i < full) {
              return (
                <Star
                  key={i}
                  className="w-3.5 h-3.5 fill-amber-400 text-amber-400"
                />
              );
            }
            if (i === full && hasHalf) {
              return (
                <Star
                  key={i}
                  className="w-3.5 h-3.5 fill-amber-200 text-amber-400"
                />
              );
            }
            return (
              <Star
                key={i}
                className="w-3.5 h-3.5 text-muted-foreground/30"
              />
            );
          })}
        </div>
        <span className="text-xs font-semibold text-muted-foreground ml-1">
          {rating.toFixed(1)}
        </span>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-neutral-50/60 text-foreground flex flex-col font-sans">
      {/* 1. Top Announcement Bar */}
      <div className="bg-primary text-primary-foreground text-xs py-2 px-4 font-medium text-center flex items-center justify-center gap-2">
        <Sparkles className="w-3.5 h-3.5 animate-pulse text-amber-300" />
        <span>
          MERN Stack E-Commerce Portfolio • Step 1: Live Catalog via Express + TypeScript
        </span>
        <span className="hidden sm:inline-flex items-center gap-1 bg-primary-foreground/15 px-2 py-0.5 rounded-full text-[11px]">
          <CheckCircle2 className="w-3 h-3 text-emerald-300" />
          GET /api/v1/products
        </span>
      </div>

      {/* 2. Header / Navbar */}
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80">
        <div className="max-w-7xl mx-auto flex h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          {/* Brand Logo & API Status */}
          <div className="flex items-center gap-3">
            <a
              href="/"
              id="storefront-brand-link"
              className="flex items-center gap-2 group transition-opacity hover:opacity-90"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-500 text-white shadow-sm shadow-indigo-500/20">
                <Sparkles className="h-5 w-5" />
              </div>
              <span className="font-extrabold text-xl tracking-tight text-foreground">
                LUMINA<span className="text-indigo-600">.shop</span>
              </span>
            </a>

            <Badge
              variant="outline"
              className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-normal border-emerald-500/30 bg-emerald-50 text-emerald-700"
              title="Connected to Express Backend on Port 5000"
            >
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              API Connected
            </Badge>
          </div>

          {/* Search bar */}
          <div className="relative flex-1 max-w-md mx-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              type="text"
              id="product-search-input"
              placeholder="Search products by title, category, keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-8 h-9 text-sm rounded-lg bg-muted/40 focus:bg-background transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                aria-label="Clear search"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 rounded"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Header Action Buttons */}
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              id="wishlist-btn-header"
              className="relative hidden sm:inline-flex gap-1.5 h-9 rounded-lg"
              title="Saved items"
            >
              <Heart
                className={`h-4 w-4 ${
                  wishlist.size > 0 ? "fill-rose-500 text-rose-500" : ""
                }`}
              />
              <span>Wishlist</span>
              {wishlist.size > 0 && (
                <Badge
                  variant="default"
                  className="ml-1 h-5 min-w-5 px-1.5 rounded-full text-[11px] bg-rose-500 hover:bg-rose-600"
                >
                  {wishlist.size}
                </Badge>
              )}
            </Button>

            <Button
              type="button"
              size="sm"
              id="cart-btn-header"
              className="relative gap-1.5 h-9 rounded-lg shadow-sm"
              title="Shopping Cart"
            >
              <ShoppingBag className="h-4 w-4" />
              <span className="hidden sm:inline">Cart</span>
              <Badge
                variant="secondary"
                className="ml-1 h-5 min-w-5 px-1.5 rounded-full text-[11px] bg-primary-foreground text-primary font-bold"
              >
                {cartCount}
              </Badge>
            </Button>
          </div>
        </div>
      </header>

      {/* 3. Hero Section */}
      <section className="bg-gradient-to-b from-indigo-50/50 via-background to-background border-b py-10 sm:py-14 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center space-y-4">
          <Badge
            variant="secondary"
            className="px-3 py-1 text-xs font-medium text-indigo-700 bg-indigo-100/70 hover:bg-indigo-100 border border-indigo-200/50 shadow-xs"
          >
            ✨ Modern MERN E-Commerce Architecture
          </Badge>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground">
            Curated Products Catalog
          </h1>

          <p className="max-w-2xl mx-auto text-muted-foreground text-sm sm:text-base leading-relaxed">
            Live catalog fetched dynamically from our Express + TypeScript REST API (
            <code className="text-xs font-mono font-semibold text-foreground bg-muted px-1.5 py-0.5 rounded">
              GET /api/v1/products
            </code>
            ). Built with React 19, Tailwind CSS, and shadcn/ui.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            <Badge variant="outline" className="gap-1.5 py-1 px-3 text-xs bg-background/80 shadow-xs">
              <Package className="w-3.5 h-3.5 text-indigo-600" />
              <span>{products.length} Total Products</span>
            </Badge>

            <Badge variant="outline" className="gap-1.5 py-1 px-3 text-xs bg-background/80 shadow-xs">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>200 OK REST Endpoint</span>
            </Badge>

            <Badge variant="outline" className="gap-1.5 py-1 px-3 text-xs bg-background/80 shadow-xs">
              <Layers className="w-3.5 h-3.5 text-blue-600" />
              <span>{Math.max(categories.length - 1, 0)} Categories</span>
            </Badge>

            <Badge variant="outline" className="gap-1.5 py-1 px-3 text-xs bg-background/80 shadow-xs">
              <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
              <span>Strict TypeScript</span>
            </Badge>
          </div>
        </div>
      </section>

      {/* 4. Main Products Catalog */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Category Filter Tabs & Results Count */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {categories.map((cat) => {
              const count =
                cat === "All"
                  ? products.length
                  : products.filter((p) => p.category === cat).length;
              const isActive = selectedCategory === cat;

              return (
                <Button
                  key={cat}
                  id={`cat-filter-${cat.toLowerCase()}`}
                  variant={isActive ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(cat)}
                  className="rounded-full h-8 text-xs shrink-0 gap-1.5 shadow-xs"
                >
                  <span>{cat}</span>
                  <Badge
                    variant={isActive ? "secondary" : "outline"}
                    className={`h-4 min-w-4 px-1 rounded-full text-[10px] ${
                      isActive ? "bg-primary-foreground text-primary font-bold" : ""
                    }`}
                  >
                    {count}
                  </Badge>
                </Button>
              );
            })}
          </div>

          <div className="text-xs font-medium text-muted-foreground whitespace-nowrap self-end sm:self-center">
            Showing <span className="font-semibold text-foreground">{filteredProducts.length}</span> of{" "}
            <span className="font-semibold text-foreground">{products.length}</span> items
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <Card className="p-12 text-center border-dashed">
            <CardContent className="flex flex-col items-center justify-center space-y-3 pt-6">
              <RefreshCw className="h-8 w-8 text-primary animate-spin" />
              <CardTitle className="text-lg">Loading Products Catalog...</CardTitle>
              <CardDescription>
                Fetching data from <code className="text-xs">http://localhost:5000/api/v1/products</code>
              </CardDescription>
            </CardContent>
          </Card>
        )}

        {/* Error State */}
        {!loading && error && (
          <Card className="p-8 text-center border-destructive/40 bg-destructive/5">
            <CardContent className="flex flex-col items-center justify-center space-y-3 pt-6">
              <div className="h-12 w-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center">
                <AlertCircle className="h-6 w-6" />
              </div>
              <CardTitle className="text-lg text-destructive">Unable to Load Products</CardTitle>
              <CardDescription className="max-w-md">
                {error}. Please verify that the Express server is running on port 5000.
              </CardDescription>
              <Button
                variant="outline"
                size="sm"
                onClick={loadProducts}
                className="gap-2 mt-2"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Retry Connection
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {!loading && !error && filteredProducts.length === 0 && (
          <Card className="p-12 text-center border-dashed">
            <CardContent className="flex flex-col items-center justify-center space-y-3 pt-6">
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                <Search className="h-6 w-6" />
              </div>
              <CardTitle className="text-lg">No Products Found</CardTitle>
              <CardDescription className="max-w-md">
                No products match "{searchQuery}" in category "{selectedCategory}".
              </CardDescription>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("All");
                }}
                className="mt-2"
              >
                Reset Search Filters
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Products Grid */}
        {!loading && !error && filteredProducts.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredProducts.map((product) => {
              const isWish = wishlist.has(product.id);
              const isLowStock = product.stock <= 20;

              return (
                <Card
                  key={product.id}
                  id={`product-${product.id}`}
                  className="group flex flex-col justify-between overflow-hidden rounded-xl border bg-card shadow-xs transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
                >
                  <div>
                    {/* Media Container with badges & wishlist toggle */}
                    <div className="relative aspect-4/3 w-full overflow-hidden bg-muted/30">
                      <img
                        src={product.image}
                        alt={product.name}
                        loading="lazy"
                        className="h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
                      />

                      <div className="absolute top-2.5 left-2.5">
                        <Badge
                          variant="secondary"
                          className="bg-background/90 backdrop-blur-xs text-[11px] font-medium shadow-xs"
                        >
                          {product.category}
                        </Badge>
                      </div>

                      <button
                        type="button"
                        id={`wishlist-toggle-${product.id}`}
                        onClick={() => toggleWishlist(product.id)}
                        aria-label="Wishlist toggle"
                        className="absolute top-2.5 right-2.5 flex h-8 w-8 items-center justify-center rounded-full bg-background/90 text-foreground backdrop-blur-xs shadow-xs transition-transform hover:scale-110 active:scale-95"
                      >
                        <Heart
                          className={`h-4 w-4 transition-colors ${
                            isWish
                              ? "fill-rose-500 text-rose-500"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                        />
                      </button>
                    </div>

                    {/* Card Body */}
                    <CardHeader className="p-4 pb-2 space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        {renderStars(product.rating)}
                        <Badge
                          variant={isLowStock ? "destructive" : "outline"}
                          className={`text-[10px] px-1.5 py-0 h-4 ${
                            !isLowStock
                              ? "border-emerald-500/30 text-emerald-700 bg-emerald-50"
                              : ""
                          }`}
                        >
                          {isLowStock ? `Only ${product.stock} left` : "In Stock"}
                        </Badge>
                      </div>

                      <CardTitle
                        className="text-base font-semibold leading-snug tracking-tight text-foreground line-clamp-1 group-hover:text-indigo-600 transition-colors"
                        title={product.name}
                      >
                        {product.name}
                      </CardTitle>

                      <div className="text-[11px] font-mono text-muted-foreground">
                        /{product.slug}
                      </div>

                      <CardDescription className="text-xs text-muted-foreground line-clamp-2 pt-1 leading-relaxed">
                        {product.description}
                      </CardDescription>
                    </CardHeader>
                  </div>

                  {/* Card Footer */}
                  <CardFooter className="p-4 pt-3 border-t bg-muted/20 flex items-center justify-between gap-2">
                    <div className="text-lg font-bold tracking-tight text-foreground">
                      ${product.price.toFixed(2)}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Button
                        type="button"
                        id={`quickview-btn-${product.id}`}
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedProduct(product)}
                        className="h-8 px-2 text-xs gap-1 rounded-lg"
                        title="Quick View Details"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">View</span>
                      </Button>

                      <Button
                        type="button"
                        id={`add-cart-btn-${product.id}`}
                        size="sm"
                        onClick={() => handleAddToCart(product)}
                        className="h-8 px-2.5 text-xs gap-1 rounded-lg shadow-xs"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>Add</span>
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      {/* 5. Quick View Dialog using shadcn Dialog */}
      <Dialog
        open={Boolean(selectedProduct)}
        onOpenChange={(open) => !open && setSelectedProduct(null)}
      >
        <DialogContent
          id="quick-view-modal"
          className="sm:max-w-2xl max-h-[90vh] overflow-y-auto p-0 gap-0 rounded-2xl"
        >
          {selectedProduct && (
            <div className="grid grid-cols-1 md:grid-cols-2">
              {/* Product Image */}
              <div className="relative aspect-square md:aspect-auto bg-muted/40 p-6 flex items-center justify-center border-b md:border-b-0 md:border-r">
                <img
                  src={selectedProduct.image}
                  alt={selectedProduct.name}
                  className="max-h-72 w-full object-contain rounded-lg shadow-xs"
                />
                <Badge
                  variant="secondary"
                  className="absolute top-3 left-3 bg-background/90 backdrop-blur-xs text-xs"
                >
                  {selectedProduct.category}
                </Badge>
              </div>

              {/* Product Info & Actions */}
              <div className="p-6 flex flex-col justify-between space-y-5">
                <div className="space-y-3">
                  <DialogHeader className="p-0 space-y-1.5 text-left">
                    <DialogTitle className="text-xl font-bold tracking-tight text-foreground">
                      {selectedProduct.name}
                    </DialogTitle>
                    <div className="text-xs font-mono text-muted-foreground">
                      Slug: /{selectedProduct.slug}
                    </div>
                  </DialogHeader>

                  <div className="flex items-center justify-between gap-2 py-1">
                    {renderStars(selectedProduct.rating)}
                    <Badge
                      variant={
                        selectedProduct.stock <= 20 ? "destructive" : "outline"
                      }
                      className={
                        selectedProduct.stock > 20
                          ? "border-emerald-500/30 text-emerald-700 bg-emerald-50 text-xs"
                          : "text-xs"
                      }
                    >
                      {selectedProduct.stock} Units Available
                    </Badge>
                  </div>

                  <div className="text-2xl font-extrabold text-foreground tracking-tight">
                    ${selectedProduct.price.toFixed(2)}
                  </div>

                  <Separator />

                  <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
                    {selectedProduct.description}
                  </DialogDescription>

                  {/* Specifications Grid */}
                  <div className="bg-muted/40 rounded-lg p-3 space-y-1.5 text-xs">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Product ID</span>
                      <span className="font-mono text-foreground font-medium">
                        {selectedProduct.id}
                      </span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Category</span>
                      <span className="text-foreground font-medium">
                        {selectedProduct.category}
                      </span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Stock Status</span>
                      <span className="text-emerald-600 font-medium">
                        {selectedProduct.stock > 0 ? "Ready to Ship" : "Out of Stock"}
                      </span>
                    </div>
                  </div>
                </div>

                <Button
                  type="button"
                  id="modal-add-to-cart-btn"
                  className="w-full gap-2 h-10 font-semibold shadow-xs"
                  onClick={() => {
                    handleAddToCart(selectedProduct);
                    setSelectedProduct(null);
                  }}
                >
                  <ShoppingBag className="w-4 h-4" />
                  Add to Cart • ${selectedProduct.price.toFixed(2)}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 6. Toast Notification */}
      {toastMessage && (
        <aside
          id="app-toast-alert"
          role="status"
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 bg-foreground text-background text-xs font-medium px-4 py-3 rounded-xl shadow-lg border border-border animate-in fade-in slide-in-from-bottom-2 duration-200"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </aside>
      )}

      {/* 7. Footer */}
      <footer className="mt-auto border-t bg-background py-6 px-4 sm:px-6 lg:px-8 text-xs text-muted-foreground">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-foreground">LUMINA Store</span>
            <span>•</span>
            <span>MERN Stack (React 19, Vite, Tailwind CSS v4, shadcn/ui)</span>
          </div>
          <div className="flex items-center gap-2">
            <span>REST API Endpoint:</span>
            <code className="bg-muted px-2 py-0.5 rounded text-[11px] font-mono text-foreground">
              http://localhost:5000/api/v1/products
            </code>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
