import { useEffect, useState, useMemo } from "react";
import { api } from "./api";
import ThemeToggle from "./ThemeToggle";
import "./Medicines.css";

const CATEGORIES = [
  "All",
  "Medicines",
  "Vitamins & Supplements",
  "Baby Care",
  "Medical Devices",
  "First Aid",
  "Personal Care",
  "Dental Care",
  "Nutrition",
];

const CAT_ICONS = {
  All: "🛍️",
  Medicines: "💊",
  "Vitamins & Supplements": "🌿",
  "Baby Care": "👶",
  "Medical Devices": "🩺",
  "First Aid": "🩹",
  "Personal Care": "🧴",
  "Dental Care": "🦷",
  Nutrition: "💪",
};

const SORT_OPTIONS = [
  { value: "featured", label: "Featured" },
  { value: "rating", label: "Top Rated" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "newest", label: "Newest" },
];

function StarRating({ rating }) {
  return (
    <span className="med-stars">
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} className={n <= Math.round(rating) ? "ms-full" : "ms-empty"}>★</span>
      ))}
      <span className="med-rating-num">{rating.toFixed(1)}</span>
    </span>
  );
}

function ProductCard({ product: p, cartQty, onAdd, onRemove, user, onAuth }) {
  const discount = p.original_price
    ? Math.round((1 - p.price / p.original_price) * 100)
    : 0;

  return (
    <div className="med-card">
      {discount > 0 && <span className="med-discount-badge">-{discount}%</span>}
      {p.requires_prescription && <span className="med-rx-badge">Rx</span>}

      <div className="med-card-emoji">{p.emoji}</div>

      <div className="med-card-body">
        <p className="med-brand">{p.brand}</p>
        <h3 className="med-name">{p.name}</h3>
        <p className="med-unit">{p.unit}</p>
        <p className="med-desc">{p.description}</p>
        <StarRating rating={Number(p.rating)} />
        <p className="med-reviews">({p.reviews_count.toLocaleString()} reviews)</p>

        <div className="med-price-row">
          <span className="med-price">৳{Number(p.price).toFixed(0)}</span>
          {p.original_price && (
            <span className="med-original-price">৳{Number(p.original_price).toFixed(0)}</span>
          )}
        </div>
      </div>

      <div className="med-card-footer">
        {!user ? (
          <button className="med-btn-login" onClick={onAuth}>
            🔒 Login to Buy
          </button>
        ) : cartQty > 0 ? (
          <div className="med-qty-row">
            <button className="med-qty-btn" onClick={() => onRemove(p.id)}>−</button>
            <span className="med-qty-num">{cartQty}</span>
            <button className="med-qty-btn" onClick={() => onAdd(p.id)}>+</button>
          </div>
        ) : (
          <button className="med-btn-add" onClick={() => onAdd(p.id)}>
            + Add to Cart
          </button>
        )}
      </div>
    </div>
  );
}

function CartPanel({ cart, products, onClose, onCheckout, onQtyChange }) {
  const cartItems = Object.entries(cart)
    .filter(([, qty]) => qty > 0)
    .map(([id, qty]) => ({ product: products.find((p) => p.id === Number(id)), qty }))
    .filter((x) => x.product);

  const total = cartItems.reduce((sum, { product: p, qty }) => sum + Number(p.price) * qty, 0);

  return (
    <div className="cart-overlay" onClick={onClose}>
      <div className="cart-panel" onClick={(e) => e.stopPropagation()}>
        <div className="cart-header">
          <h2>🛒 Your Cart</h2>
          <button className="cart-close" onClick={onClose}>✕</button>
        </div>

        {cartItems.length === 0 ? (
          <div className="cart-empty">
            <div className="cart-empty-icon">🛒</div>
            <p>Your cart is empty</p>
          </div>
        ) : (
          <>
            <div className="cart-items">
              {cartItems.map(({ product: p, qty }) => (
                <div className="cart-item" key={p.id}>
                  <span className="ci-emoji">{p.emoji}</span>
                  <div className="ci-info">
                    <p className="ci-name">{p.name}</p>
                    <p className="ci-unit">{p.unit}</p>
                  </div>
                  <div className="ci-right">
                    <div className="ci-qty-row">
                      <button onClick={() => onQtyChange(p.id, qty - 1)}>−</button>
                      <span>{qty}</span>
                      <button onClick={() => onQtyChange(p.id, qty + 1)}>+</button>
                    </div>
                    <p className="ci-price">৳{(Number(p.price) * qty).toFixed(0)}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="cart-footer">
              <div className="cart-total-row">
                <span>Subtotal ({cartItems.reduce((s, x) => s + x.qty, 0)} items)</span>
                <strong>৳{total.toFixed(0)}</strong>
              </div>
              <p className="cart-delivery-note">🚚 Free delivery on orders above ৳500</p>
              <button className="cart-checkout-btn" onClick={onCheckout}>
                Proceed to Checkout →
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function CheckoutModal({ cart, products, user, onClose, onSuccess }) {
  const [form, setForm] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
    address: "",
    city: "Dhaka",
    payment: "COD",
  });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const cartItems = Object.entries(cart)
    .filter(([, qty]) => qty > 0)
    .map(([id, qty]) => ({ product: products.find((p) => p.id === Number(id)), qty }))
    .filter((x) => x.product);

  const total = cartItems.reduce((sum, { product: p, qty }) => sum + Number(p.price) * qty, 0);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    if (!form.address.trim()) return setErr("Please enter your delivery address.");
    setLoading(true);
    setErr("");
    try {
      const items = cartItems.map(({ product: p, qty }) => ({
        id: p.id,
        name: p.name,
        price: Number(p.price),
        qty,
      }));
      const order = await api.placeMedicineOrder({
        items,
        total,
        address: `${form.name}, ${form.phone}, ${form.address}, ${form.city}`,
        phone: form.phone,
        payment_method: form.payment,
      });
      onSuccess(order.order);
    } catch (ex) {
      setErr(ex.message);
    } finally {
      setLoading(false);
    }
  }

  const PAYMENT_OPTS = [
    { value: "COD", label: "💵 Cash on Delivery" },
    { value: "bKash", label: "📱 bKash" },
    { value: "Nagad", label: "📱 Nagad" },
    { value: "Rocket", label: "📱 Rocket" },
  ];

  return (
    <div className="co-backdrop" onClick={onClose}>
      <div className="co-card" onClick={(e) => e.stopPropagation()}>
        <div className="co-header">
          <h2>Checkout</h2>
          <button className="co-close" onClick={onClose}>✕</button>
        </div>

        <form className="co-form" onSubmit={submit}>
          <p className="co-section-title">Delivery Details</p>

          <div className="co-row">
            <div className="co-col">
              <label>Full Name</label>
              <input value={form.name} onChange={set("name")} required placeholder="Your name" />
            </div>
            <div className="co-col">
              <label>Phone</label>
              <input value={form.phone} onChange={set("phone")} required placeholder="01XXXXXXXXX" />
            </div>
          </div>

          <label>Delivery Address</label>
          <textarea
            value={form.address}
            onChange={set("address")}
            required
            rows={3}
            placeholder="House/Flat No., Road, Area…"
          />

          <label>City</label>
          <select value={form.city} onChange={set("city")}>
            {["Dhaka", "Chittagong", "Rajshahi", "Sylhet", "Khulna", "Mymensingh", "Barishal"].map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>

          <p className="co-section-title">Payment Method</p>
          <div className="co-payment-grid">
            {PAYMENT_OPTS.map((o) => (
              <label key={o.value} className={`co-pay-opt ${form.payment === o.value ? "active" : ""}`}>
                <input
                  type="radio"
                  name="payment"
                  value={o.value}
                  checked={form.payment === o.value}
                  onChange={set("payment")}
                />
                {o.label}
              </label>
            ))}
          </div>

          <div className="co-summary">
            <div className="co-summary-row">
              <span>{cartItems.reduce((s, x) => s + x.qty, 0)} items</span>
              <span>৳{total.toFixed(0)}</span>
            </div>
            <div className="co-summary-row">
              <span>Delivery</span>
              <span className={total >= 500 ? "co-free" : ""}>
                {total >= 500 ? "FREE" : "৳50"}
              </span>
            </div>
            <div className="co-summary-total">
              <strong>Total</strong>
              <strong>৳{(total >= 500 ? total : total + 50).toFixed(0)}</strong>
            </div>
          </div>

          {err && <p className="co-err">{err}</p>}

          <button className="co-submit-btn" type="submit" disabled={loading}>
            {loading ? "Placing order…" : "Place Order →"}
          </button>
        </form>
      </div>
    </div>
  );
}

function OrderSuccessModal({ order, onClose }) {
  const orderId = `ORD-${String(order.id).padStart(6, "0")}`;
  const items = order.items || [];
  const count = items.reduce((s, x) => s + x.qty, 0);

  return (
    <div className="os-backdrop" onClick={onClose}>
      <div className="os-card" onClick={(e) => e.stopPropagation()}>
        <div className="os-icon">✅</div>
        <h2 className="os-title">Order Placed!</h2>
        <p className="os-ref">Order ID: <strong>{orderId}</strong></p>
        <div className="os-info">
          <div className="os-row"><span>Items</span><span>{count}</span></div>
          <div className="os-row"><span>Total</span><span>৳{Number(order.total).toFixed(0)}</span></div>
          <div className="os-row"><span>Payment</span><span>{order.payment_method}</span></div>
          <div className="os-row"><span>Delivery</span><span>2–3 business days</span></div>
        </div>
        <p className="os-note">
          {order.payment_method === "COD"
            ? "💵 Pay in cash when your order arrives."
            : `📱 Pay via ${order.payment_method} to 01XXXXXXXXX after confirmation.`}
        </p>
        <button className="os-btn" onClick={onClose}>Continue Shopping</button>
      </div>
    </div>
  );
}

function MyOrders({ user }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.myMedicineOrders()
      .then((d) => setOrders(d.orders))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="med-loading">Loading orders…</p>;
  if (!orders.length)
    return (
      <div className="med-empty">
        <div style={{ fontSize: "3rem" }}>📦</div>
        <p>You haven't placed any orders yet.</p>
      </div>
    );

  return (
    <div className="mo-list">
      {orders.map((o) => {
        const orderId = `ORD-${String(o.id).padStart(6, "0")}`;
        const items = o.items || [];
        const count = items.reduce((s, x) => s + x.qty, 0);
        return (
          <div className="mo-row" key={o.id}>
            <div className="mo-left">
              <p className="mo-ref">{orderId}</p>
              <p className="mo-items">{count} item{count !== 1 ? "s" : ""} · ৳{Number(o.total).toFixed(0)}</p>
              <p className="mo-addr">{o.address}</p>
            </div>
            <div className="mo-right">
              <span className={`mo-status ${o.status}`}>{o.status}</span>
              <p className="mo-pay">{o.payment_method}</p>
              <p className="mo-date">{new Date(o.created_at).toLocaleDateString("en-GB")}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function Medicines({ user, onBack, onAuth }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState({});
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [successOrder, setSuccessOrder] = useState(null);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [sort, setSort] = useState("featured");
  const [tab, setTab] = useState("shop");

  useEffect(() => {
    api.publicMedicines()
      .then((d) => setProducts(d.medicines))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let list = products;
    if (category !== "All") list = list.filter((p) => p.category === category);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.brand?.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q)
      );
    }
    const sortFns = {
      featured:   (a, b) => (b.is_featured - a.is_featured) || b.rating - a.rating,
      rating:     (a, b) => b.rating - a.rating,
      price_asc:  (a, b) => a.price - b.price,
      price_desc: (a, b) => b.price - a.price,
      newest:     (a, b) => b.id - a.id,
    };
    return [...list].sort(sortFns[sort] || sortFns.featured);
  }, [products, category, search, sort]);

  const cartCount = Object.values(cart).reduce((a, b) => a + b, 0);

  function addToCart(id) {
    setCart((c) => ({ ...c, [id]: (c[id] || 0) + 1 }));
  }
  function removeFromCart(id) {
    setCart((c) => {
      const next = { ...c, [id]: (c[id] || 1) - 1 };
      if (next[id] <= 0) delete next[id];
      return next;
    });
  }
  function setQty(id, qty) {
    if (qty <= 0) {
      setCart((c) => { const n = { ...c }; delete n[id]; return n; });
    } else {
      setCart((c) => ({ ...c, [id]: qty }));
    }
  }

  function handleCheckout() {
    setCartOpen(false);
    setCheckoutOpen(true);
  }

  function handleOrderSuccess(order) {
    setCheckoutOpen(false);
    setCart({});
    setSuccessOrder(order);
  }

  return (
    <div className="med-page">
      {/* NAV */}
      <header className="med-nav">
        <button className="med-back-btn" onClick={onBack}>← Back</button>
        <div className="med-brand">
          💊 <span>SaveLife</span>
          <span className="med-brand-sep">·</span>
          <span className="med-brand-sub">Pharmacy</span>
        </div>
        <div style={{ flex: 1 }} />
        <ThemeToggle />
        <button
          className="med-cart-btn"
          onClick={() => { if (!user) { onAuth(); } else { setCartOpen(true); } }}
        >
          🛒
          {cartCount > 0 && <span className="med-cart-badge">{cartCount}</span>}
        </button>
      </header>

      {/* TAB BAR */}
      {user && (
        <div className="med-tab-bar">
          <button
            className={`med-tab ${tab === "shop" ? "active" : ""}`}
            onClick={() => setTab("shop")}
          >
            🛍️ Shop
          </button>
          <button
            className={`med-tab ${tab === "orders" ? "active" : ""}`}
            onClick={() => setTab("orders")}
          >
            📦 My Orders
          </button>
        </div>
      )}

      {tab === "orders" && user ? (
        <div className="med-orders-section">
          <h2 className="med-orders-title">My Orders</h2>
          <MyOrders user={user} />
        </div>
      ) : (
        <>
          {/* HERO BANNER */}
          <div className="med-hero">
            <div className="med-hero-inner">
              <span className="med-hero-tag">🏥 SaveLife Pharmacy</span>
              <h1>Medicines & Health Products</h1>
              <p>120+ products · Genuine brands · Delivered to your door</p>
              <div className="med-hero-pills">
                <span>💊 Medicines</span>
                <span>🌿 Vitamins</span>
                <span>👶 Baby Care</span>
                <span>🩺 Devices</span>
                <span>🦷 Dental</span>
              </div>
            </div>
          </div>

          {/* CATEGORY BAR */}
          <div className="med-cat-bar">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                className={`med-cat-btn ${category === c ? "active" : ""}`}
                onClick={() => setCategory(c)}
              >
                {CAT_ICONS[c]} {c}
              </button>
            ))}
          </div>

          {/* SEARCH + SORT */}
          <div className="med-toolbar">
            <input
              className="med-search"
              placeholder="Search medicines, brands…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select
              className="med-sort-select"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            {(search || category !== "All") && (
              <button
                className="med-clear-btn"
                onClick={() => { setSearch(""); setCategory("All"); }}
              >
                Clear
              </button>
            )}
            <span className="med-count">{filtered.length} products</span>
          </div>

          {/* PRODUCT GRID */}
          <div className="med-grid-section">
            {loading ? (
              <p className="med-loading">Loading products…</p>
            ) : filtered.length === 0 ? (
              <div className="med-empty">
                <div style={{ fontSize: "3rem" }}>🔍</div>
                <p>No products found. Try a different search.</p>
              </div>
            ) : (
              <div className="med-grid">
                {filtered.map((p) => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    cartQty={cart[p.id] || 0}
                    onAdd={addToCart}
                    onRemove={removeFromCart}
                    user={user}
                    onAuth={onAuth}
                  />
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* CART PANEL */}
      {cartOpen && (
        <CartPanel
          cart={cart}
          products={products}
          onClose={() => setCartOpen(false)}
          onCheckout={handleCheckout}
          onQtyChange={setQty}
        />
      )}

      {/* CHECKOUT */}
      {checkoutOpen && (
        <CheckoutModal
          cart={cart}
          products={products}
          user={user}
          onClose={() => setCheckoutOpen(false)}
          onSuccess={handleOrderSuccess}
        />
      )}

      {/* SUCCESS */}
      {successOrder && (
        <OrderSuccessModal
          order={successOrder}
          onClose={() => setSuccessOrder(null)}
        />
      )}
    </div>
  );
}
