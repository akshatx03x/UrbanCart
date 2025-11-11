import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const SHOPIFY_API_VERSION = '2025-07';
const SHOPIFY_STORE_PERMANENT_DOMAIN = 'shop-iverse-hub-0y5hs.myshopify.com';
const SHOPIFY_STOREFRONT_URL = `https://${SHOPIFY_STORE_PERMANENT_DOMAIN}/api/${SHOPIFY_API_VERSION}/graphql.json`;
const SHOPIFY_STOREFRONT_TOKEN = 'b778796441b1b7a980335606161f653c';

export interface ShopifyProduct {
  node: {
    id: string;
    title: string;
    description: string;
    handle: string;
    productType?: string;
    priceRange: {
      minVariantPrice: {
        amount: string;
        currencyCode: string;
      };
    };
    images: {
      edges: Array<{
        node: {
          url: string;
          altText: string | null;
        };
      }>;
    };
    variants: {
      edges: Array<{
        node: {
          id: string;
          title: string;
          price: {
            amount: string;
            currencyCode: string;
          };
          availableForSale: boolean;
          selectedOptions: Array<{
            name: string;
            value: string;
          }>;
        };
      }>;
    };
    options: Array<{
      name: string;
      values: string[];
    }>;
  };
}

export async function fetchSupabaseProducts(): Promise<ShopifyProduct[]> {
  try {
    const { data: products, error } = await supabase
      .from('products')
      .select(`
        id,
        name,
        slug,
        description,
        price,
        stock,
        image_url
      `)
      .gt('stock', 0); // Only fetch products with stock > 0

    if (error) throw error;

    return products.map(product => ({
      node: {
        id: `supabase-${product.id}`,
        title: product.name,
        description: product.description || '',
        handle: product.slug,
        productType: 'General',
        priceRange: {
          minVariantPrice: {
            amount: product.price.toString(),
            currencyCode: 'USD'
          }
        },
        images: {
          edges: product.image_url ? [{
            node: {
              url: product.image_url,
              altText: product.name
            }
          }] : []
        },
        variants: {
          edges: [{
            node: {
              id: `variant-supabase-${product.id}`,
              title: 'Default Title',
              price: {
                amount: product.price.toString(),
                currencyCode: 'USD'
              },
              availableForSale: product.stock > 0,
              selectedOptions: []
            }
          }]
        },
        options: []
      }
    }));
  } catch (error) {
    console.error('Error fetching Supabase products:', error);
    return [];
  }
}

export interface CartItem {
  product: ShopifyProduct;
  variantId: string;
  variantTitle: string;
  price: {
    amount: string;
    currencyCode: string;
  };
  quantity: number;
  selectedOptions: Array<{
    name: string;
    value: string;
  }>;
}

const STOREFRONT_QUERY = `
  query GetProducts($first: Int!) {
    products(first: $first) {
      edges {
        node {
          id
          title
          description
          handle
          productType
          priceRange {
            minVariantPrice {
              amount
              currencyCode
            }
          }
          images(first: 5) {
            edges {
              node {
                url
                altText
              }
            }
          }
          variants(first: 10) {
            edges {
              node {
                id
                title
                price {
                  amount
                  currencyCode
                }
                availableForSale
                selectedOptions {
                  name
                  value
                }
              }
            }
          }
          options {
            name
            values
          }
        }
      }
    }
  }
`;

const CART_CREATE_MUTATION = `
  mutation cartCreate($input: CartInput!) {
    cartCreate(input: $input) {
      cart {
        id
        checkoutUrl
        totalQuantity
        cost {
          totalAmount {
            amount
            currencyCode
          }
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`;

export async function storefrontApiRequest(query: string, variables: any = {}) {
  const response = await fetch(SHOPIFY_STOREFRONT_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Storefront-Access-Token': SHOPIFY_STOREFRONT_TOKEN
    },
    body: JSON.stringify({
      query,
      variables,
    }),
  });

  if (response.status === 402) {
    toast.error("Shopify: Payment required", {
      description: "Shopify API access requires an active Shopify billing plan. Your store needs to be upgraded to a paid plan. Visit https://admin.shopify.com to upgrade.",
    });
    return;
  }

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  
  if (data.errors) {
    throw new Error(`Error calling Shopify: ${data.errors.map((e: any) => e.message).join(', ')}`);
  }

  return data;
}

export async function fetchProducts(limit = 20): Promise<ShopifyProduct[]> {
  // Return dummy products only, removing Shopify API dependency
  return getDummyProducts().slice(0, limit);
}

export async function createStorefrontCheckout(items: CartItem[]): Promise<string> {
  try {
    const lines = items.map(item => ({
      quantity: item.quantity,
      merchandiseId: item.variantId,
    }));

    const cartData = await storefrontApiRequest(CART_CREATE_MUTATION, {
      input: {
        lines,
      },
    });

    if (cartData.data.cartCreate.userErrors.length > 0) {
      throw new Error(`Cart creation failed: ${cartData.data.cartCreate.userErrors.map((e: any) => e.message).join(', ')}`);
    }

    const cart = cartData.data.cartCreate.cart;

    if (!cart.checkoutUrl) {
      throw new Error('No checkout URL returned from Shopify');
    }

    const url = new URL(cart.checkoutUrl);
    url.searchParams.set('channel', 'online_store');
    return url.toString();
  } catch (error) {
    console.error('Error creating storefront checkout:', error);
    throw error;
  }
}

function getDummyProducts(): ShopifyProduct[] {
  return [
    {
      node: {
        id: "dummy-1",
        title: "Premium Coffee Beans",
        description: "Rich, aromatic coffee beans sourced from the finest plantations. Perfect for your morning brew.",
        handle: "premium-coffee-beans",
        productType: "Food",
        priceRange: {
          minVariantPrice: {
            amount: "24.99",
            currencyCode: "USD"
          }
        },
        images: {
          edges: [{
            node: {
              url: "/assets/products/coffee-beans.jpg",
              altText: "Premium Coffee Beans"
            }
          }]
        },
        variants: {
          edges: [{
            node: {
              id: "variant-1",
              title: "Default Title",
              price: {
                amount: "24.99",
                currencyCode: "USD"
              },
              availableForSale: true,
              selectedOptions: []
            }
          }]
        },
        options: []
      }
    },
    {
      node: {
        id: "dummy-2",
        title: "Cotton T-Shirt",
        description: "Comfortable 100% cotton t-shirt with a classic fit. Available in multiple colors.",
        handle: "cotton-t-shirt",
        productType: "Clothing",
        priceRange: {
          minVariantPrice: {
            amount: "19.99",
            currencyCode: "USD"
          }
        },
        images: {
          edges: [{
            node: {
              url: "/assets/products/cotton-tshirt.jpg",
              altText: "Cotton T-Shirt"
            }
          }]
        },
        variants: {
          edges: [{
            node: {
              id: "variant-2",
              title: "Default Title",
              price: {
                amount: "19.99",
                currencyCode: "USD"
              },
              availableForSale: true,
              selectedOptions: []
            }
          }]
        },
        options: []
      }
    },
    {
      node: {
        id: "dummy-3",
        title: "Designer Hoodie",
        description: "Premium designer hoodie with unique patterns. Made from high-quality materials.",
        handle: "designer-hoodie",
        productType: "Clothing",
        priceRange: {
          minVariantPrice: {
            amount: "89.99",
            currencyCode: "USD"
          }
        },
        images: {
          edges: [{
            node: {
              url: "/assets/products/designer-hoodie.jpg",
              altText: "Designer Hoodie"
            }
          }]
        },
        variants: {
          edges: [{
            node: {
              id: "variant-3",
              title: "Default Title",
              price: {
                amount: "89.99",
                currencyCode: "USD"
              },
              availableForSale: true,
              selectedOptions: []
            }
          }]
        },
        options: []
      }
    },
    {
      node: {
        id: "dummy-4",
        title: "Grain Bread",
        description: "Freshly baked whole grain bread made with organic ingredients. Perfect for healthy meals.",
        handle: "grain-bread",
        productType: "Food",
        priceRange: {
          minVariantPrice: {
            amount: "5.99",
            currencyCode: "USD"
          }
        },
        images: {
          edges: [{
            node: {
              url: "/assets/products/grain-bread.jpg",
              altText: "Grain Bread"
            }
          }]
        },
        variants: {
          edges: [{
            node: {
              id: "variant-4",
              title: "Default Title",
              price: {
                amount: "5.99",
                currencyCode: "USD"
              },
              availableForSale: true,
              selectedOptions: []
            }
          }]
        },
        options: []
      }
    },
    {
      node: {
        id: "dummy-5",
        title: "iPhone 15 Pro",
        description: "Latest iPhone 15 Pro with advanced features and stunning camera capabilities.",
        handle: "iphone-15-pro",
        productType: "Mobile",
        priceRange: {
          minVariantPrice: {
            amount: "999.99",
            currencyCode: "USD"
          }
        },
        images: {
          edges: [{
            node: {
              url: "/assets/products/iphone-15-pro.jpg",
              altText: "iPhone 15 Pro"
            }
          }]
        },
        variants: {
          edges: [{
            node: {
              id: "variant-5",
              title: "Default Title",
              price: {
                amount: "999.99",
                currencyCode: "USD"
              },
              availableForSale: true,
              selectedOptions: []
            }
          }]
        },
        options: []
      }
    },
    {
      node: {
        id: "dummy-6",
        title: "Organic Bananas",
        description: "Fresh organic bananas packed with nutrients. Perfect for smoothies and snacks.",
        handle: "organic-bananas",
        productType: "Food",
        priceRange: {
          minVariantPrice: {
            amount: "3.99",
            currencyCode: "USD"
          }
        },
        images: {
          edges: [{
            node: {
              url: "/assets/products/organic-bananas.jpg",
              altText: "Organic Bananas"
            }
          }]
        },
        variants: {
          edges: [{
            node: {
              id: "variant-6",
              title: "Default Title",
              price: {
                amount: "3.99",
                currencyCode: "USD"
              },
              availableForSale: true,
              selectedOptions: []
            }
          }]
        },
        options: []
      }
    },
    {
      node: {
        id: "dummy-7",
        title: "Samsung S24",
        description: "Samsung Galaxy S24 with cutting-edge technology and exceptional performance.",
        handle: "samsung-s24",
        productType: "Mobile",
        priceRange: {
          minVariantPrice: {
            amount: "799.99",
            currencyCode: "USD"
          }
        },
        images: {
          edges: [{
            node: {
              url: "/assets/products/samsung-s24.jpg",
              altText: "Samsung S24"
            }
          }]
        },
        variants: {
          edges: [{
            node: {
              id: "variant-7",
              title: "Default Title",
              price: {
                amount: "799.99",
                currencyCode: "USD"
              },
              availableForSale: true,
              selectedOptions: []
            }
          }]
        },
        options: []
      }
    },
    {
      node: {
        id: "dummy-8",
        title: "Slim Jeans",
        description: "Modern slim-fit jeans made from premium denim. Comfortable and stylish.",
        handle: "slim-jeans",
        productType: "Clothing",
        priceRange: {
          minVariantPrice: {
            amount: "79.99",
            currencyCode: "USD"
          }
        },
        images: {
          edges: [{
            node: {
              url: "/assets/products/slim-jeans.jpg",
              altText: "Slim Jeans"
            }
          }]
        },
        variants: {
          edges: [{
            node: {
              id: "variant-8",
              title: "Default Title",
              price: {
                amount: "79.99",
                currencyCode: "USD"
              },
              availableForSale: true,
              selectedOptions: []
            }
          }]
        },
        options: []
      }
    },
    {
      node: {
        id: "dummy-9",
        title: "Wireless Headphones",
        description: "High-quality wireless headphones with noise cancellation and premium sound.",
        handle: "wireless-headphones",
        productType: "Electronics",
        priceRange: {
          minVariantPrice: {
            amount: "199.99",
            currencyCode: "USD"
          }
        },
        images: {
          edges: [{
            node: {
              url: "/assets/products/wireless-headphones.jpg",
              altText: "Wireless Headphones"
            }
          }]
        },
        variants: {
          edges: [{
            node: {
              id: "variant-9",
              title: "Default Title",
              price: {
                amount: "199.99",
                currencyCode: "USD"
              },
              availableForSale: true,
              selectedOptions: []
            }
          }]
        },
        options: []
      }
    },
    {
      node: {
        id: "dummy-10",
        title: "Vintage Leather Jacket",
        description: "Classic vintage leather jacket with distressed finish. Timeless style and durability.",
        handle: "vintage-leather-jacket",
        productType: "Clothing",
        priceRange: {
          minVariantPrice: {
            amount: "149.99",
            currencyCode: "USD"
          }
        },
        images: {
          edges: [{
            node: {
              url: "/assets/products/coffee-beans.jpg",
              altText: "Vintage Leather Jacket"
            }
          }]
        },
        variants: {
          edges: [{
            node: {
              id: "variant-10",
              title: "Default Title",
              price: {
                amount: "149.99",
                currencyCode: "USD"
              },
              availableForSale: true,
              selectedOptions: []
            }
          }]
        },
        options: []
      }
    },
    {
      node: {
        id: "dummy-11",
        title: "Smart Watch Series 8",
        description: "Advanced smartwatch with health monitoring, GPS, and long battery life.",
        handle: "smart-watch-series-8",
        productType: "Electronics",
        priceRange: {
          minVariantPrice: {
            amount: "349.99",
            currencyCode: "USD"
          }
        },
        images: {
          edges: [{
            node: {
              url: "/assets/products/cotton-tshirt.jpg",
              altText: "Smart Watch Series 8"
            }
          }]
        },
        variants: {
          edges: [{
            node: {
              id: "variant-11",
              title: "Default Title",
              price: {
                amount: "349.99",
                currencyCode: "USD"
              },
              availableForSale: true,
              selectedOptions: []
            }
          }]
        },
        options: []
      }
    },
    {
      node: {
        id: "dummy-12",
        title: "Ceramic Dinner Set",
        description: "Elegant ceramic dinner set for 6 people. Microwave and dishwasher safe.",
        handle: "ceramic-dinner-set",
        productType: "Home",
        priceRange: {
          minVariantPrice: {
            amount: "89.99",
            currencyCode: "USD"
          }
        },
        images: {
          edges: [{
            node: {
              url: "/assets/products/designer-hoodie.jpg",
              altText: "Ceramic Dinner Set"
            }
          }]
        },
        variants: {
          edges: [{
            node: {
              id: "variant-12",
              title: "Default Title",
              price: {
                amount: "89.99",
                currencyCode: "USD"
              },
              availableForSale: true,
              selectedOptions: []
            }
          }]
        },
        options: []
      }
    },
    {
      node: {
        id: "dummy-13",
        title: "Yoga Mat Premium",
        description: "Non-slip premium yoga mat with carrying strap. Perfect for all types of yoga practice.",
        handle: "yoga-mat-premium",
        productType: "Sports",
        priceRange: {
          minVariantPrice: {
            amount: "39.99",
            currencyCode: "USD"
          }
        },
        images: {
          edges: [{
            node: {
              url: "/assets/products/grain-bread.jpg",
              altText: "Yoga Mat Premium"
            }
          }]
        },
        variants: {
          edges: [{
            node: {
              id: "variant-13",
              title: "Default Title",
              price: {
                amount: "39.99",
                currencyCode: "USD"
              },
              availableForSale: true,
              selectedOptions: []
            }
          }]
        },
        options: []
      }
    },
    {
      node: {
        id: "dummy-14",
        title: "Bluetooth Speaker",
        description: "Portable Bluetooth speaker with 360-degree sound and waterproof design.",
        handle: "bluetooth-speaker",
        productType: "Electronics",
        priceRange: {
          minVariantPrice: {
            amount: "79.99",
            currencyCode: "USD"
          }
        },
        images: {
          edges: [{
            node: {
              url: "/assets/products/iphone-15-pro.jpg",
              altText: "Bluetooth Speaker"
            }
          }]
        },
        variants: {
          edges: [{
            node: {
              id: "variant-14",
              title: "Default Title",
              price: {
                amount: "79.99",
                currencyCode: "USD"
              },
              availableForSale: true,
              selectedOptions: []
            }
          }]
        },
        options: []
      }
    },
    {
      node: {
        id: "dummy-15",
        title: "Organic Green Tea",
        description: "Premium organic green tea leaves sourced from sustainable farms. Rich in antioxidants.",
        handle: "organic-green-tea",
        productType: "Food",
        priceRange: {
          minVariantPrice: {
            amount: "12.99",
            currencyCode: "USD"
          }
        },
        images: {
          edges: [{
            node: {
              url: "/assets/products/organic-bananas.jpg",
              altText: "Organic Green Tea"
            }
          }]
        },
        variants: {
          edges: [{
            node: {
              id: "variant-15",
              title: "Default Title",
              price: {
                amount: "12.99",
                currencyCode: "USD"
              },
              availableForSale: true,
              selectedOptions: []
            }
          }]
        },
        options: []
      }
    },
    {
      node: {
        id: "dummy-16",
        title: "Running Shoes Pro",
        description: "Professional running shoes with advanced cushioning and breathable mesh upper.",
        handle: "running-shoes-pro",
        productType: "Sports",
        priceRange: {
          minVariantPrice: {
            amount: "129.99",
            currencyCode: "USD"
          }
        },
        images: {
          edges: [{
            node: {
              url: "/assets/products/samsung-s24.jpg",
              altText: "Running Shoes Pro"
            }
          }]
        },
        variants: {
          edges: [{
            node: {
              id: "variant-16",
              title: "Default Title",
              price: {
                amount: "129.99",
                currencyCode: "USD"
              },
              availableForSale: true,
              selectedOptions: []
            }
          }]
        },
        options: []
      }
    },
    {
      node: {
        id: "dummy-17",
        title: "Wall Art Canvas",
        description: "Beautiful abstract wall art canvas print. Adds character to any room.",
        handle: "wall-art-canvas",
        productType: "Home",
        priceRange: {
          minVariantPrice: {
            amount: "59.99",
            currencyCode: "USD"
          }
        },
        images: {
          edges: [{
            node: {
              url: "/assets/products/slim-jeans.jpg",
              altText: "Wall Art Canvas"
            }
          }]
        },
        variants: {
          edges: [{
            node: {
              id: "variant-17",
              title: "Default Title",
              price: {
                amount: "59.99",
                currencyCode: "USD"
              },
              availableForSale: true,
              selectedOptions: []
            }
          }]
        },
        options: []
      }
    },
    {
      node: {
        id: "dummy-18",
        title: "Stainless Steel Water Bottle",
        description: "Insulated stainless steel water bottle that keeps drinks cold for 24 hours.",
        handle: "stainless-steel-water-bottle",
        productType: "Sports",
        priceRange: {
          minVariantPrice: {
            amount: "29.99",
            currencyCode: "USD"
          }
        },
        images: {
          edges: [{
            node: {
              url: "/assets/products/wireless-headphones.jpg",
              altText: "Stainless Steel Water Bottle"
            }
          }]
        },
        variants: {
          edges: [{
            node: {
              id: "variant-18",
              title: "Default Title",
              price: {
                amount: "29.99",
                currencyCode: "USD"
              },
              availableForSale: true,
              selectedOptions: []
            }
          }]
        },
        options: []
      }
    },
    {
      node: {
        id: "dummy-19",
        title: "Gaming Mechanical Keyboard",
        description: "RGB mechanical keyboard with blue switches. Perfect for gaming and typing.",
        handle: "gaming-mechanical-keyboard",
        productType: "Electronics",
        priceRange: {
          minVariantPrice: {
            amount: "149.99",
            currencyCode: "USD"
          }
        },
        images: {
          edges: [{
            node: {
              url: "/assets/products/coffee-beans.jpg",
              altText: "Gaming Mechanical Keyboard"
            }
          }]
        },
        variants: {
          edges: [{
            node: {
              id: "variant-19",
              title: "Default Title",
              price: {
                amount: "149.99",
                currencyCode: "USD"
              },
              availableForSale: true,
              selectedOptions: []
            }
          }]
        },
        options: []
      }
    },
    {
      node: {
        id: "dummy-20",
        title: "Luxury Perfume",
        description: "Elegant luxury perfume with floral and woody notes. Long-lasting fragrance.",
        handle: "luxury-perfume",
        productType: "Beauty",
        priceRange: {
          minVariantPrice: {
            amount: "89.99",
            currencyCode: "USD"
          }
        },
        images: {
          edges: [{
            node: {
              url: "/assets/products/cotton-tshirt.jpg",
              altText: "Luxury Perfume"
            }
          }]
        },
        variants: {
          edges: [{
            node: {
              id: "variant-20",
              title: "Default Title",
              price: {
                amount: "89.99",
                currencyCode: "USD"
              },
              availableForSale: true,
              selectedOptions: []
            }
          }]
        },
        options: []
      }
    }
  ];
}
