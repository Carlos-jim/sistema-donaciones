/**
 * Test script for /api/admin/medicamentos endpoints
 * Run: node scripts/test-medicamentos.mjs
 * Requires the dev server running at localhost:3000
 */

const BASE = "http://localhost:3000";

// ─── Helpers ─────────────────────────────────────────────────────────────────
let cookie = "";

function log(title, status, body) {
  const ok = status >= 200 && status < 300;
  console.log(`\n${ok ? "✅" : "❌"} [${status}] ${title}`);
  console.log(JSON.stringify(body, null, 2));
}

async function request(method, path, body) {
  const opts = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(cookie ? { Cookie: cookie } : {}),
    },
  };
  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(`${BASE}${path}`, opts);

  // Capture Set-Cookie from login
  const setCookie = res.headers.get("set-cookie");
  if (setCookie) {
    // Extract admin-token=<value> from the header
    const match = setCookie.match(/(admin-token=[^;]+)/);
    if (match) cookie = match[1];
  }

  let data;
  try { data = await res.json(); } catch { data = {}; }
  return { status: res.status, data };
}

// ─── Test suite ──────────────────────────────────────────────────────────────
async function run() {
  console.log("═══════════════════════════════════════════");
  console.log("  Medicamentos API — Integration Test");
  console.log(`  Target: ${BASE}`);
  console.log("═══════════════════════════════════════════");

  // 1. Admin login
  console.log("\n── STEP 1: Admin Login ─────────────────────");
  const login = await request("POST", "/api/admin/auth/login", {
    email: "admin@medishare.com",
    password: "admin123",
  });
  log("POST /api/admin/auth/login", login.status, login.data);

  if (login.status !== 200) {
    console.error("\n🛑 Login failed — aborting tests");
    process.exit(1);
  }
  console.log(`\n🍪 Cookie captured: ${cookie}`);

  // 2. GET all medications (initially may be empty or have seed data)
  console.log("\n── STEP 2: GET all medicamentos ─────────────");
  const getAll = await request("GET", "/api/admin/medicamentos");
  log("GET /api/admin/medicamentos", getAll.status, getAll.data);
  console.log("\n📋 Structure of first item (if any):");
  if (Array.isArray(getAll.data) && getAll.data.length > 0) {
    console.log("  Keys:", Object.keys(getAll.data[0]).join(", "));
    console.log("  _count:", getAll.data[0]._count);
  } else {
    console.log("  (array vacío o sin items aún)");
  }

  // 3. POST — create a medication
  console.log("\n── STEP 3: POST — Crear medicamento ────────");
  const created = await request("POST", "/api/admin/medicamentos", {
    nombre: "Paracetamol Test 500mg",
    principioActivo: "Paracetamol",
    presentacion: "Tabletas",
    concentracion: "500mg",
    descripcion: "Analgésico y antipirético — creado por test script",
  });
  log("POST /api/admin/medicamentos", created.status, created.data);

  if (created.status !== 201) {
    console.error("\n🛑 Create failed — aborting PATCH/DELETE tests");
    process.exit(1);
  }
  const medId = created.data.id;
  console.log(`\n🆔 Medicamento creado con id: ${medId}`);

  // 4. POST — duplicate name should return 409
  console.log("\n── STEP 4: POST — Nombre duplicado (debe dar 409) ──");
  const dup = await request("POST", "/api/admin/medicamentos", {
    nombre: "PARACETAMOL TEST 500MG", // same name, different case
    principioActivo: "Paracetamol",
  });
  log("POST /api/admin/medicamentos (dup)", dup.status, dup.data);

  // 5. PATCH — update the medication
  console.log("\n── STEP 5: PATCH — Editar medicamento ──────");
  const patched = await request("PATCH", `/api/admin/medicamentos/${medId}`, {
    concentracion: "1000mg",
    descripcion: "Dosis actualizada por test script",
  });
  log(`PATCH /api/admin/medicamentos/${medId}`, patched.status, patched.data);
  if (patched.status === 200) {
    console.log("  ✔ concentracion:", patched.data.concentracion);
    console.log("  ✔ descripcion:", patched.data.descripcion);
  }

  // 6. PATCH — toggle active to false
  console.log("\n── STEP 6: PATCH — Toggle activo → false ───");
  const toggled = await request("PATCH", `/api/admin/medicamentos/${medId}`, {
    activo: false,
  });
  log(`PATCH /api/admin/medicamentos/${medId} (toggle)`, toggled.status, toggled.data);
  if (toggled.status === 200) {
    console.log("  ✔ activo:", toggled.data.activo);
  }

  // 7. GET all again — confirm our med is in the list with correct structure
  console.log("\n── STEP 7: GET all — confirmar estructura ──");
  const getAll2 = await request("GET", "/api/admin/medicamentos");
  log("GET /api/admin/medicamentos (post-create)", getAll2.status, {
    total: Array.isArray(getAll2.data) ? getAll2.data.length : "?",
  });
  const ourMed = Array.isArray(getAll2.data)
    ? getAll2.data.find((m) => m.id === medId)
    : null;
  if (ourMed) {
    console.log("\n📦 Estructura del medicamento creado (recibida por frontend):");
    console.log(JSON.stringify(ourMed, null, 2));
    console.log("\n  ✔ Campos requeridos por el frontend:");
    const required = ["id", "nombre", "principioActivo", "presentacion", "concentracion", "descripcion", "activo", "createdAt", "_count"];
    for (const field of required) {
      const present = field in ourMed;
      console.log(`    ${present ? "✅" : "❌"} ${field}: ${JSON.stringify(ourMed[field])}`);
    }
    const countOk = typeof ourMed._count?.solicitudes === "number" && typeof ourMed._count?.donaciones === "number";
    console.log(`    ${countOk ? "✅" : "❌"} _count.solicitudes + _count.donaciones presentes`);
  } else {
    console.log("  ⚠ No se encontró el medicamento en la lista");
  }

  // 8. DELETE — hard delete (no related records)
  console.log("\n── STEP 8: DELETE — Eliminar medicamento ───");
  const deleted = await request("DELETE", `/api/admin/medicamentos/${medId}`);
  log(`DELETE /api/admin/medicamentos/${medId}`, deleted.status, deleted.data);
  if (deleted.status === 200) {
    console.log("  ✔ tipo de borrado:", deleted.data.type ?? "hard-delete");
  }

  // 9. GET — confirm deleted
  console.log("\n── STEP 9: GET all — confirmar eliminación ──");
  const getAll3 = await request("GET", "/api/admin/medicamentos");
  const stillExists = Array.isArray(getAll3.data) && getAll3.data.some((m) => m.id === medId);
  console.log(`  ${stillExists ? "❌ Sigue en la lista (inesperado)" : "✅ Eliminado correctamente"}`);

  // 10. DELETE — non-existent ID
  console.log("\n── STEP 10: DELETE — ID inválido (debe dar 404) ─");
  const notFound = await request("DELETE", "/api/admin/medicamentos/id-que-no-existe");
  log("DELETE /api/admin/medicamentos/id-que-no-existe", notFound.status, notFound.data);

  // ─── Summary ─────────────────────────────────────────────────────────────
  console.log("\n═══════════════════════════════════════════");
  console.log("  Resumen de tests");
  console.log("═══════════════════════════════════════════");
  const results = [
    ["Login admin", login.status === 200],
    ["GET lista", getAll.status === 200],
    ["POST crear", created.status === 201],
    ["POST duplicado → 409", dup.status === 409],
    ["PATCH editar", patched.status === 200],
    ["PATCH toggle activo", toggled.status === 200],
    ["GET lista (post-create)", getAll2.status === 200],
    ["Estructura correcta para frontend", !!ourMed],
    ["DELETE eliminar", deleted.status === 200],
    ["GET confirmar eliminación", !stillExists],
    ["DELETE 404 ID inválido", notFound.status === 404],
  ];
  let passed = 0;
  for (const [name, ok] of results) {
    console.log(`  ${ok ? "✅" : "❌"} ${name}`);
    if (ok) passed++;
  }
  console.log(`\n  ${passed}/${results.length} tests pasados`);
  console.log("═══════════════════════════════════════════\n");

  process.exit(passed === results.length ? 0 : 1);
}

run().catch((err) => {
  console.error("💥 Error fatal:", err.message);
  process.exit(1);
});
