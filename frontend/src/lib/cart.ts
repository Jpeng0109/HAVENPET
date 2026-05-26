export type CartItem = {
  skuId: string;
  skuVariantCode: string;
  productName: string;
  flavour: string | null;
  weightLabel: string | null;
  priceUsd: number;
  priceLocal: number;
  currency: string;
  quantity: number;
  hqAvailable: number;
};

const CART_KEY = 'havenpet_cart';

export function getCart(): CartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(CART_KEY) ?? '[]');
  } catch {
    return [];
  }
}

export function saveCart(items: CartItem[]) {
  localStorage.setItem(CART_KEY, JSON.stringify(items));
}

export function addToCart(item: Omit<CartItem, 'quantity'>, qty = 1) {
  const cart = getCart();
  const existing = cart.find((c) => c.skuId === item.skuId);
  if (existing) {
    existing.quantity = Math.min(existing.quantity + qty, item.hqAvailable);
  } else {
    cart.push({ ...item, quantity: Math.min(qty, item.hqAvailable) });
  }
  saveCart(cart);
  return cart;
}

export function updateCartQty(skuId: string, quantity: number) {
  const cart = getCart().map((c) =>
    c.skuId === skuId ? { ...c, quantity: Math.max(1, Math.min(quantity, c.hqAvailable)) } : c,
  );
  saveCart(cart);
  return cart;
}

export function removeFromCart(skuId: string) {
  const cart = getCart().filter((c) => c.skuId !== skuId);
  saveCart(cart);
  return cart;
}

export function clearCart() {
  localStorage.removeItem(CART_KEY);
}
