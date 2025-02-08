"use client";
import "@mantine/core/styles.css";
import { AppShell } from "@mantine/core";

import {
  ColorSchemeScript,
  mantineHtmlProps,
  MantineProvider,
} from "@mantine/core";
import { Inter } from "next/font/google";
import "./globals.css";
import Script from "next/script";
import { GoogleTagManager } from "@next/third-parties/google";

const inter = Inter({ subsets: ["latin"] });
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" {...mantineHtmlProps}>
      <head>
        <title>Auburn Crime Map</title>
        <meta
          name="viewport"
          content="minimum-scale=1, initial-scale=1, width=device-width"
        />
        <link rel="shortcut icon" href="/favicon.ico" />
        <meta property="og:image" content="/static/images/og.png" />
        <meta name="title" content="Auburn Crime Map" />
        <meta
          name="description"
          content="Online tool to visualize Auburn crime data."
        />
        <ColorSchemeScript />
      </head>
      <GoogleTagManager gtmId="G-GGXECGJ35B" />
      <body className={inter.className}>
        <MantineProvider forceColorScheme="light">
          <AppShell>
            <AppShell.Main>{children}</AppShell.Main>
          </AppShell>
        </MantineProvider>
      </body>
    </html>
  );
}
