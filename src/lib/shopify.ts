import { toast } from "sonner";

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
  try {
    const data = await storefrontApiRequest(STOREFRONT_QUERY, { first: limit });
    return data?.data?.products?.edges || [];
  } catch (error) {
    // Return dummy data when Shopify API is unavailable
    console.warn('Shopify API unavailable, using dummy data:', error);
    return getDummyProducts().slice(0, limit);
  }
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
              url: "/src/assets/products/coffee-beans.jpg",
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
              url: "/src/assets/products/cotton-tshirt.jpg",
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
              url: "/src/assets/products/designer-hoodie.jpg",
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
              url: "/src/assets/products/grain-bread.jpg",
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
              url: "/src/assets/products/iphone-15-pro.jpg",
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
              url: "/src/assets/products/organic-bananas.jpg",
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
              url: "/src/assets/products/samsung-s24.jpg",
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
              url: "/src/assets/products/slim-jeans.jpg",
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
              url: "/src/assets/products/wireless-headphones.jpg",
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
    }
  ];
}
