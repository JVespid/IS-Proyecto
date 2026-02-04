import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AuthProvider from "@/components/auth/AuthProvider";

export const metadata = {
  title: "Sistema de Pase de Lista con QR",
  description: "Sistema de gestión de asistencia con códigos QR",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
