import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { createOrder, getCurrentUser, getProducts, type Order, type OrderPayload, type Product, type User } from "./api";

export type Session = { token: string; user: User } | null;
type Cart = Record<number, number>;
type CartLine = { product: Product; quantity: number };

type AppContextValue = {
  auth: Session;
  products: Product[];
  productsLoading: boolean;
  productsError: string;
  apiReady: boolean | null;
  cart: Cart;
  cartLines: CartLine[];
  cartCount: number;
  cartOpen: boolean;
  setCartOpen: (open: boolean) => void;
  saveSession: (session: Exclude<Session, null>) => void;
  updateSessionUser: (user: User) => void;
  logout: () => void;
  refreshProducts: () => Promise<void>;
  addToCart: (product: Product, quantity: number) => void;
  updateCartQuantity: (product: Product, quantity: number) => void;
  placeOrder: (details: Omit<OrderPayload, "items">) => Promise<Order>;
};

const SESSION_KEY = "ngoc-cam-phuong-session";
const AppContext = createContext<AppContextValue | null>(null);

function loadSession(): Session {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) as Session : null;
  } catch {
    return null;
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<Session>(loadSession);
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState("");
  const [apiReady, setApiReady] = useState<boolean | null>(null);
  const [cart, setCart] = useState<Cart>({});
  const [cartOpen, setCartOpen] = useState(false);

  async function refreshProducts() {
    setProductsLoading(true);
    setProductsError("");
    try {
      setProducts(await getProducts());
    } catch (reason) {
      setProductsError((reason as Error).message);
    } finally {
      setProductsLoading(false);
    }
  }

  // Backend co the san sang cham hon frontend (khoi dong sau, hoac Neon can vai giay de thuc day),
  // nen lan tai dau tien tu thu lai thay vi bao loi ngay.
  useEffect(() => {
    let cancelled = false;
    let timer = 0;
    async function load(attempt: number) {
      try {
        const next = await getProducts();
        if (cancelled) return;
        setProducts(next);
        setProductsError("");
        setApiReady(true);
        setProductsLoading(false);
      } catch (reason) {
        if (cancelled) return;
        if (attempt < 5) {
          timer = window.setTimeout(() => void load(attempt + 1), 2000);
          return;
        }
        setProductsError((reason as Error).message);
        setApiReady(false);
        setProductsLoading(false);
      }
    }
    void load(0);
    return () => { cancelled = true; window.clearTimeout(timer); };
  }, []);

  useEffect(() => {
    if (!auth?.token) return;
    void getCurrentUser(auth.token)
      .then(({ user }) => updateSessionUser(user))
      .catch(() => logout());
  }, [auth?.token]);

  function saveSession(session: Exclude<Session, null>) {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    setAuth(session);
  }

  function updateSessionUser(user: User) {
    setAuth((current) => {
      if (!current) return current;
      const next = { ...current, user };
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(next));
      return next;
    });
  }

  function logout() {
    sessionStorage.removeItem(SESSION_KEY);
    setAuth(null);
    setCart({});
    setCartOpen(false);
  }

  function addToCart(product: Product, quantity: number) {
    setCart((current) => ({
      ...current,
      [product.id]: Math.min((current[product.id] ?? 0) + quantity, product.stock_quantity),
    }));
    setCartOpen(true);
  }

  function updateCartQuantity(product: Product, quantity: number) {
    setCart((current) => {
      const next = { ...current };
      if (quantity <= 0) delete next[product.id];
      else next[product.id] = Math.min(quantity, product.stock_quantity);
      return next;
    });
  }

  const cartLines = useMemo(() => Object.entries(cart)
    .map(([id, quantity]) => {
      const product = products.find((item) => item.id === Number(id));
      return product ? { product, quantity } : null;
    })
    .filter((line): line is CartLine => line !== null), [cart, products]);

  async function placeOrder(details: Omit<OrderPayload, "items">) {
    if (!auth || auth.user.role !== "customer") throw new Error("Vui lòng đăng nhập bằng tài khoản khách hàng");
    if (cartLines.length === 0) throw new Error("Giỏ hàng đang trống");
    const order = await createOrder(auth.token, {
      ...details,
      items: cartLines.map(({ product, quantity }) => ({ product_id: product.id, quantity })),
    });
    setCart({});
    setCartOpen(false);
    void refreshProducts();
    return order;
  }

  const value: AppContextValue = {
    auth,
    products,
    productsLoading,
    productsError,
    apiReady,
    cart,
    cartLines,
    cartCount: cartLines.reduce((sum, line) => sum + line.quantity, 0),
    cartOpen,
    setCartOpen,
    saveSession,
    updateSessionUser,
    logout,
    refreshProducts,
    addToCart,
    updateCartQuantity,
    placeOrder,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const value = useContext(AppContext);
  if (!value) throw new Error("useApp must be used inside AppProvider");
  return value;
}
