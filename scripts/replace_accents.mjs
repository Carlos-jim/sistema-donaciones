import fs from 'fs';
import path from 'path';

const filesToProcess = [
    '/home/carlos/Documentos/sistema-donaciones/app/admin/dashboard-client.tsx',
    '/home/carlos/Documentos/sistema-donaciones/app/admin/layout.tsx',
    '/home/carlos/Documentos/sistema-donaciones/app/api/auth/logout/route.ts',
    '/home/carlos/Documentos/sistema-donaciones/app/dashboard/donations/page.tsx',
    '/home/carlos/Documentos/sistema-donaciones/app/dashboard/profile/page.tsx',
    '/home/carlos/Documentos/sistema-donaciones/app/dashboard/requests/page.tsx',
    '/home/carlos/Documentos/sistema-donaciones/app/pharmacy/actions.ts',
    '/home/carlos/Documentos/sistema-donaciones/app/pharmacy/login/page.tsx',
    '/home/carlos/Documentos/sistema-donaciones/app/pharmacy/page.tsx',
    '/home/carlos/Documentos/sistema-donaciones/app/pharmacy/reception/page.tsx',
    '/home/carlos/Documentos/sistema-donaciones/app/pharmacy/requests/page.tsx',
    '/home/carlos/Documentos/sistema-donaciones/app/supervisor/layout.tsx',
    '/home/carlos/Documentos/sistema-donaciones/app/supervisor/login/page.tsx',
    '/home/carlos/Documentos/sistema-donaciones/app/supervisor/page.tsx',
    '/home/carlos/Documentos/sistema-donaciones/app/supervisor/requests-inbox.tsx',
    '/home/carlos/Documentos/sistema-donaciones/components/map-view.tsx',
    '/home/carlos/Documentos/sistema-donaciones/components/medication-request-card.tsx',
    '/home/carlos/Documentos/sistema-donaciones/components/pharmacy-sidebar.tsx',
    '/home/carlos/Documentos/sistema-donaciones/components/portal-login-card.tsx'
];

const exactReplacements = [
    ['"Sin telefono"', '"Sin teléfono"'],
    ['"Sin telefono registrado"', '"Sin teléfono registrado"'],
    ['"Sin telefono re', '"Sin teléfono re'],
    ['"Cedula"', '"Cédula"'],
    ['"Telefono"', '"Teléfono"'],
    ['"Codigo"', '"Código"'],
    ['>Telefono:<', '>Teléfono:<'],
    ['>Codigo:<', '>Código:<'],
    ['>Codigo', '>Código'],
    ['"Cerrar sesion"', '"Cerrar sesión"'],
    ['"Sesion cerrada exitosament', '"Sesión cerrada exitosament'],
    ['"Sin codigo"', '"Sin código"'],
    ['"Sin codigo asignado"', '"Sin código asignado"'],
    ['"Codigo:"', '"Código:"'],
    ['Nueva donacion', 'Nueva donación'],
    ['Cuando hagas una donacion', 'Cuando hagas una donación'],
    ['"Detalle de donacion"', '"Detalle de donación"'],
    ['"Oferta de donacion"', '"Oferta de donación"'],
    ['"Foto de la donacion"', '"Foto de la donación"'],
    ['"Intenta iniciar sesion de nuevo."', '"Intenta iniciar sesión de nuevo."'],
    ['"Codigo de retiro:"', '"Código de retiro:"'],
    ['"Ingresa un codigo valido"', '"Ingresa un código válido"'],
    ['"El codigo no corresponde a es', '"El código no corresponde a es'],
    ['"Error al buscar el codigo"', '"Error al buscar el código"'],
    ['"Codigo no encontrado"', '"Código no encontrado"'],
    ['"La donacion ya esta asignada a ', '"La donación ya está asignada a '],
    ['"Esta donacion no corresponde a tu', '"Esta donación no corresponde a tu'],
    ['"Donacion no encontrada"', '"Donación no encontrada"'],
    ['"Recepcion, validacion y entrega segura de', '"Recepción, validación y entrega segura de'],
    ['"Valida codigos de donacion y retiro desde el p', '"Valida códigos de donación y retiro desde el p'],
    ['"Cuando una donacion quede recibida en e', '"Cuando una donación quede recibida en e'],
    ['Direccion', 'Dirección'],
    ['esperando recepcion, validacion o retiro.', 'esperando recepción, validación o retiro.'],
    ['o la entrega, falta recepcion";', 'o la entrega, falta recepción";'],
    ['"Procesar recepcion"', '"Procesar recepción"'],
    ['Resumen de recepcion, solicitudes activa', 'Resumen de recepción, solicitudes activa'],
    ['que esta esperando recepcion, validacion o retir', 'que está esperando recepción, validación o retir'],
    ['"Ingresa codigo o QR"', '"Ingresa código o QR"'],
    ['"Donacion"', '"Donación"'],
    ['"Validacion general"', '"Validación general"'],
    ['Validacion obligatoria de ident', 'Validación obligatoria de ident'],
    ['"Validacion de identidad — Dona', '"Validación de identidad — Dona'],
    ['"Recepcion de farmacia"', '"Recepción de farmacia"'],
    ['esperan entrega o validacion.', 'esperan entrega o validación.'],
    ['ega, confirmacion o validacion"', 'ega, confirmación o validación"'],
    ['toca validar en recepcion";', 'toca validar en recepción";'],
    ['Ir a recepcion', 'Ir a recepción'],
    ['Procesar en recepcion', 'Procesar en recepción'],
    ['"Revision y aprobacion de solicitudes medi', '"Revisión y aprobación de solicitudes medi'],
    ['Gestion de Solicitudes', 'Gestión de Solicitudes'],
    ['Telefono:', 'Teléfono:'],
    ['Validacion de identidad', 'Validación de identidad'],
    ['dias)"', 'días)"'],
    ['Ultima aprobacion:', 'Última aprobación:'],
    ['Donacion Centro', 'Donación Centro'],
    ['Donacion Sur', 'Donación Sur'],
    ['Guarda tu codigo', 'Guarda tu código'],
    ['Presenta tu codigo', 'Presenta tu código'],
    ['Codigo copiado', 'Código copiado'],
    ['Codigo de entrega', 'Código de entrega'],
    ['Codigo donante', 'Código donante'],
    ['Confirmar donacion', 'Confirmar donación'],
    ['Donacion confirmada', 'Donación confirmada'],
    ['"Recepcion"', '"Recepción"'],
    ['"No se pudo iniciar sesion"', '"No se pudo iniciar sesión"'],
    ['"Sesion iniciada"', '"Sesión iniciada"'],
    ['>Direccion<', '>Dirección<'],
    ['Insumos medicos', 'Insumos médicos'],
    ['Confirmar Donacion', 'Confirmar Donación'],
    ['recibira su propio codigo por separado', 'recibirá su propio código por separado'],
    ['toca validar en recepcion', 'toca validar en recepción'],
    ['solo veras tu codigo de entrega', 'solo verás tu código de entrega']
];

for (const filePath of filesToProcess) {
    if (!fs.existsSync(filePath)) {
        console.log(`File not found: ${filePath}`);
        continue;
    }
    let content = fs.readFileSync(filePath, 'utf-8');
    let originalContent = content;
    let modified = false;

    for (const [target, replacement] of exactReplacements) {
        if (content.includes(target)) {
            // replace all occurrences of target
            const pieces = content.split(target);
            content = pieces.join(replacement);
            modified = true;
        }
    }

    if (modified) {
        fs.writeFileSync(filePath, content, 'utf-8');
        console.log(`Updated ${filePath}`);
    }
}
