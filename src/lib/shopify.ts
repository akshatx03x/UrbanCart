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
              url: "https://plus.unsplash.com/premium_photo-1675435644687-562e8042b9db?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8Y29mZmVlJTIwYmVhbnN8ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&q=60&w=600",
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
              url: "https://plus.unsplash.com/premium_photo-1673125287084-e90996bad505?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTN8fGNvdHRvbiUyMHRzaGlydHxlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&q=60&w=600",
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
              url: "https://plus.unsplash.com/premium_photo-1673125510222-1a51e3a8ccb0?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OXx8aG9vZGllfGVufDB8fDB8fHww&auto=format&fit=crop&q=60&w=600",
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
              url: "https://images.unsplash.com/photo-1509440159596-0249088772ff?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8QnJlYWR8ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&q=60&w=600",
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
              url: "https://images.unsplash.com/photo-1609692814858-f7cd2f0afa4f?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTB8fGlwaG9uZXxlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&q=60&w=600",
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
              url: "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8YmFuYW5hc3xlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&q=60&w=600",
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
              url: "https://images.unsplash.com/photo-1706469980834-36cc556c02c2?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8c2Ftc3VuZyUyMHMyNHxlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&q=60&w=600",
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
        description: "Cotton Jeans made with high-quality fabric for a comfortable fit.",
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
              url: "https://images.unsplash.com/photo-1714729382668-7bc3bb261662?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTJ8fEplYW5zfGVufDB8fDB8fHww&auto=format&fit=crop&q=60&w=600",
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
              url: "https://images.unsplash.com/photo-1521223890158-f9f7c3d5d504?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTB8fGphY2tldCUyMGxlYXRoZXJ8ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&q=60&w=600",
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
              url: "https://images.unsplash.com/photo-1687259126959-83ebfc093a77?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8N3x8d2F0Y2glMjBzbWFydHxlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&q=60&w=600",
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
              url: "https://images.unsplash.com/photo-1738484708927-c1f45df0b56e?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8ZGlubmVyJTIwc2V0fGVufDB8fDB8fHww&auto=format&fit=crop&q=60&w=600",
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
              url: "https://images.unsplash.com/photo-1624651208388-f8726eace8f2?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTR8fHlvZ2ElMjBtYXR8ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&q=60&w=600",
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
              url: "https://images.unsplash.com/photo-1507878566509-a0dbe19677a5?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTJ8fGJsdWV0b290aCUyMHNwZWFrZXJ8ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&q=60&w=600",
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
              url: "https://images.unsplash.com/photo-1701520839071-55bdfe64c5ed?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Nnx8Z3JlZW4lMjB0ZWF8ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&q=60&w=600",
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
              url: "https://images.unsplash.com/photo-1597892657493-6847b9640bac?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8cnVubmluZyUyMHNob2VzfGVufDB8fDB8fHww&auto=format&fit=crop&q=60&w=600",
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
              url: "https://images.unsplash.com/photo-1570061851151-7adc1853e16e?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8d2FsbCUyMGFydCUyMGNhbnZhfGVufDB8fDB8fHww&auto=format&fit=crop&q=60&w=600",
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
              url: "https://images.unsplash.com/photo-1605274280925-9dd1baacb97b?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTV8fHdhdGVyJTIwYm90dGxlJTIwc3RlZWx8ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&q=60&w=600",
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
              url: "https://images.unsplash.com/photo-1616248304589-6a3d8d60ad7d?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8a2V5Ym9yZHxlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&q=60&w=600",
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
              url: "https://images.unsplash.com/photo-1547887537-6158d64c35b3?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OHx8cGVyZnVtZXxlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&q=60&w=600",
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
