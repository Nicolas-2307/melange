import { describe, expect, it } from "vitest";

import { isAdminEmail } from "@/features/auth/admin-email";
import { authErrorMessage } from "@/features/auth/errors";
import { safeRedirectPath } from "@/features/auth/redirect";
import { signInSchema, signUpSchema } from "@/features/auth/schemas";

describe("safeRedirectPath", () => {
  it("permite rutas internas", () => {
    expect(safeRedirectPath("/admin")).toBe("/admin");
    expect(safeRedirectPath("/carrito?paso=2")).toBe("/carrito?paso=2");
  });

  it("bloquea redirecciones a otros sitios", () => {
    expect(safeRedirectPath("https://evil.com")).toBe("/");
    expect(safeRedirectPath("//evil.com")).toBe("/");
    expect(safeRedirectPath("/\\evil.com")).toBe("/");
    expect(safeRedirectPath("javascript:alert(1)")).toBe("/");
  });

  it("usa el valor por defecto si no hay destino", () => {
    expect(safeRedirectPath(null)).toBe("/");
    expect(safeRedirectPath(undefined, "/cuenta")).toBe("/cuenta");
  });
});

describe("isAdminEmail", () => {
  it("compara sin importar mayúsculas ni espacios", () => {
    expect(isAdminEmail(" Dueno@Melange.co ", "dueno@melange.co")).toBe(true);
  });

  it("es falso si no hay ADMIN_EMAIL o el correo es otro", () => {
    expect(isAdminEmail("dueno@melange.co", undefined)).toBe(false);
    expect(isAdminEmail("otro@melange.co", "dueno@melange.co")).toBe(false);
  });
});

describe("signUpSchema", () => {
  const valid = {
    name: "Ana",
    email: "ANA@Correo.com ",
    password: "segura123",
    confirmPassword: "segura123",
  };

  it("acepta datos válidos y normaliza el correo", () => {
    const result = signUpSchema.parse(valid);
    expect(result.email).toBe("ana@correo.com");
  });

  it("rechaza contraseñas cortas o que no coinciden", () => {
    expect(
      signUpSchema.safeParse({ ...valid, password: "corta", confirmPassword: "corta" }).success,
    ).toBe(false);
    const mismatch = signUpSchema.safeParse({ ...valid, confirmPassword: "otra1234" });
    expect(mismatch.success).toBe(false);
    expect(mismatch.error?.issues[0]?.path).toEqual(["confirmPassword"]);
  });
});

describe("signInSchema", () => {
  it("exige correo válido y contraseña", () => {
    expect(signInSchema.safeParse({ email: "no-es-correo", password: "x" }).success).toBe(false);
    expect(signInSchema.safeParse({ email: "a@b.co", password: "" }).success).toBe(false);
  });
});

describe("authErrorMessage", () => {
  it("traduce errores conocidos", () => {
    expect(authErrorMessage({ code: "INVALID_EMAIL_OR_PASSWORD" })).toBe(
      "Correo o contraseña incorrectos.",
    );
    expect(authErrorMessage({ status: 429 })).toMatch(/Demasiados intentos/);
  });

  it("usa un mensaje genérico para errores desconocidos", () => {
    expect(authErrorMessage({ code: "ALGO_RARO" })).toBe("Algo salió mal. Inténtalo de nuevo.");
    expect(authErrorMessage(null)).toBe("Algo salió mal. Inténtalo de nuevo.");
  });
});
