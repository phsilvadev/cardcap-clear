import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  reactStrictMode: false,
  // Preserva a origem no rewrite, inclusive ao usar IPs de loopback no ambiente local.
  skipProxyUrlNormalize: true,
  async redirects() {
    return [
      {
        source: "/cardap-carrinho.html",
        destination: "/carrinho",
        permanent: true,
      },
      {
        source: "/cardap-checkout.html",
        destination: "/checkout",
        permanent: true,
      },
      {
        source: "/cardap-cliente.html",
        destination: "/cliente",
        permanent: true,
      },
      {
        source: "/cardap-dashboard.html",
        destination: "/dashboard",
        permanent: true,
      },
      {
        source: "/cardap-loja.html",
        destination: "/loja",
        permanent: true,
      },
      {
        source: "/cardap-pagamento.html",
        destination: "/pagamento",
        permanent: true,
      },
      {
        source: "/cardap-pedido-confirmado.html",
        destination: "/pedido-confirmado",
        permanent: true,
      },
      {
        source: "/cardap-produto.html",
        destination: "/produto",
        permanent: true,
      },
      {
        source: "/cardap-restaurantes.html",
        destination: "/restaurantes",
        permanent: true,
      },
      {
        source: "/cardap.html",
        destination: "/",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
