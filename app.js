let contadorAmbientes = 0;
let proyectoActualId = null;
let inputActivo = null;

document.addEventListener('DOMContentLoaded', () => {
  cargarCatalogos();
  agregarAmbiente();
  solicitarPersistencia();
});

// Solicitar almacenamiento persistente para proteger datos del cliente
async function solicitarPersistencia() {
  if (navigator.storage && navigator.storage.persist) {
    const granted = await navigator.storage.persist();
    if (granted) {
      console.log('Almacenamiento persistente concedido');
    }
  }
}

// --- SALIR ---
function salirApp() {
  document.getElementById('modalSalir').classList.remove('hidden');
}

function confirmarSalir() {
  document.getElementById('modalSalir').classList.add('hidden');
  window.close();
}

function cancelarSalir() {
  document.getElementById('modalSalir').classList.add('hidden');
}

// --- LÓGICA DEL TECLADO FLOTANTE ---
function abrirTeclado(inputEl, titulo) {
  inputActivo = inputEl;
  document.getElementById('keypadTitle').innerText = titulo;
  document.getElementById('keypadDisplay').innerText = inputEl.value || '0';
  document.getElementById('keypadModal').classList.remove('hidden');
}

function cerrarTeclado() {
  document.getElementById('keypadModal').classList.add('hidden');
  inputActivo = null;
}

function pressKey(val) {
  if (!inputActivo) return;
  const display = document.getElementById('keypadDisplay');
  let actual = display.innerText;

  if (val === 'CLR') {
    actual = '0';
  } else if (val === 'DEL') {
    actual = actual.length > 1 ? actual.slice(0, -1) : '0';
  } else if (val === '.') {
    if (!actual.includes('.')) actual += '.';
  } else {
    actual = actual === '0' ? val : actual + val;
  }

  display.innerText = actual;
  inputActivo.value = actual === '0' ? '' : actual;
  calcularTotales();
}

// --- CATÁLOGOS ---
function obtenerAmbientesGuardados() {
  const predeterminados = ['Baño', 'Cocina', 'Sala', 'Habitación', 'Piscina', 'Terraza', 'Pasillo', 'Fachada'];
  const guardados = JSON.parse(localStorage.getItem('catalogoAmbientes') || '[]');
  return [...new Set([...predeterminados, ...guardados])];
}

function registrarNuevoAmbiente(nombre) {
  if (!nombre || !nombre.trim()) return;
  // No guardar nombres genéricos como "Ambiente 1", "Ambiente 2", etc.
  if (/^Ambiente\s+\d+$/i.test(nombre.trim())) return;
  const ambientes = JSON.parse(localStorage.getItem('catalogoAmbientes') || '[]');
  if (!ambientes.includes(nombre.trim())) {
    ambientes.push(nombre.trim());
    localStorage.setItem('catalogoAmbientes', JSON.stringify(ambientes));
    cargarCatalogos();
  }
}

function obtenerSuperficiesGuardadas() {
  const predeterminadas = ['Piso', 'Pared', 'Persiana', 'Borde / Coronación', 'Zócalo / Rodapié', 'Techo / Cielo Raso', 'Fondo / Vaso'];
  const guardadas = JSON.parse(localStorage.getItem('catalogoSuperficies') || '[]');
  return [...new Set([...predeterminadas, ...guardadas])];
}

function obtenerAcabadosGuardados() {
  const predeterminados = ['Porcelanato 60x60', 'Cerámica 30x60', 'Enchape 20x30', 'Pintura Tipo 1'];
  const guardados = JSON.parse(localStorage.getItem('catalogoAcabados') || '[]');
  return [...new Set([...predeterminados, ...guardados])];
}

function cargarCatalogos() {
  document.getElementById('listaAmbientes').innerHTML = obtenerAmbientesGuardados().map(a => `<option value="${a}">`).join('');
}

function generarOpcionesSuperficies(seleccionada) {
  const opciones = obtenerSuperficiesGuardadas();
  let html = '<option value="">-- Seleccionar --</option>';
  opciones.forEach(s => {
    html += `<option value="${s}" ${s === seleccionada ? 'selected' : ''}>${s}</option>`;
  });
  html += '<option value="__otro__">+ Agregar nuevo...</option>';
  return html;
}

function generarOpcionesAcabados(seleccionado) {
  const opciones = obtenerAcabadosGuardados();
  let html = '<option value="">-- Seleccionar --</option>';
  opciones.forEach(a => {
    html += `<option value="${a}" ${a === seleccionado ? 'selected' : ''}>${a}</option>`;
  });
  html += '<option value="__otro__">+ Agregar nuevo...</option>';
  return html;
}

let selectActivo = null;
let tipoModalCatalogo = null;

function onCambioSuperficie(selectEl, idAmbiente) {
  if (selectEl.value === '__otro__') {
    selectActivo = selectEl;
    tipoModalCatalogo = 'superficie';
    document.getElementById('modalCatalogoTitulo').innerText = 'Nueva Superficie / Tipo';
    document.getElementById('inputCatalogoNuevo').placeholder = 'Ej: Muro, Escalera, Fachada...';
    document.getElementById('inputCatalogoNuevo').value = '';
    document.getElementById('modalCatalogo').classList.remove('hidden');
    setTimeout(() => document.getElementById('inputCatalogoNuevo').focus(), 100);
  } else {
    verificarPersiana(idAmbiente);
  }
}

function onCambioAcabado(selectEl) {
  if (selectEl.value === '__otro__') {
    selectActivo = selectEl;
    tipoModalCatalogo = 'acabado';
    document.getElementById('modalCatalogoTitulo').innerText = 'Nuevo Acabado / Formato';
    document.getElementById('inputCatalogoNuevo').placeholder = 'Ej: Mármol 80x80, Vinilo...';
    document.getElementById('inputCatalogoNuevo').value = '';
    document.getElementById('modalCatalogo').classList.remove('hidden');
    setTimeout(() => document.getElementById('inputCatalogoNuevo').focus(), 100);
  }
}

function confirmarCatalogo() {
  const valor = document.getElementById('inputCatalogoNuevo').value.trim();
  if (!valor) return;

  if (tipoModalCatalogo === 'superficie') {
    registrarNuevaSuperficie(valor);
    // Actualizar todos los selects de superficie
    document.querySelectorAll('.superficie-val').forEach(sel => {
      const actual = sel.value === '__otro__' && sel === selectActivo ? valor : sel.value;
      sel.innerHTML = generarOpcionesSuperficies(actual);
    });
    if (selectActivo) selectActivo.value = valor;
    // Verificar persiana después de agregar
    const ambCard = selectActivo.closest('.ambiente-card');
    if (ambCard) verificarPersiana(ambCard.id);
  } else {
    registrarNuevoAcabado(valor);
    document.querySelectorAll('.acabado-val').forEach(sel => {
      const actual = sel.value === '__otro__' && sel === selectActivo ? valor : sel.value;
      sel.innerHTML = generarOpcionesAcabados(actual);
    });
    if (selectActivo) selectActivo.value = valor;
  }

  document.getElementById('modalCatalogo').classList.add('hidden');
  selectActivo = null;
  tipoModalCatalogo = null;
}

function cancelarCatalogo() {
  if (selectActivo) selectActivo.value = '';
  document.getElementById('modalCatalogo').classList.add('hidden');
  selectActivo = null;
  tipoModalCatalogo = null;
}

function registrarNuevaSuperficie(nombre) {
  if (!nombre || !nombre.trim()) return;
  const superficies = JSON.parse(localStorage.getItem('catalogoSuperficies') || '[]');
  if (!superficies.includes(nombre.trim())) {
    superficies.push(nombre.trim());
    localStorage.setItem('catalogoSuperficies', JSON.stringify(superficies));
    cargarCatalogos();
  }
}

function registrarNuevoAcabado(nombre) {
  if (!nombre || !nombre.trim()) return;
  const acabados = JSON.parse(localStorage.getItem('catalogoAcabados') || '[]');
  if (!acabados.includes(nombre.trim())) {
    acabados.push(nombre.trim());
    localStorage.setItem('catalogoAcabados', JSON.stringify(acabados));
    cargarCatalogos();
  }
}

// --- NOTIFICACIONES ---
function mostrarNotificacion(titulo, mensaje, icono = '✓', colorBg = 'bg-emerald-100', colorText = 'text-emerald-600') {
  document.getElementById('avisoTitulo').innerText = titulo;
  document.getElementById('avisoMensaje').innerText = mensaje;
  const elIcono = document.getElementById('avisoIcono');
  elIcono.innerText = icono;
  elIcono.className = `w-12 h-12 ${colorBg} ${colorText} rounded-full flex items-center justify-center mx-auto text-xl font-bold`;
  document.getElementById('modalAviso').classList.remove('hidden');
}

function cerrarAviso() { document.getElementById('modalAviso').classList.add('hidden'); }

function nuevaMedicion() {
  // Guardar catálogos actuales antes de limpiar
  document.querySelectorAll('.ambiente-nombre').forEach(input => {
    if (input.value) registrarNuevoAmbiente(input.value);
  });
  document.querySelectorAll('.superficie-val').forEach(input => {
    if (input.value && input.value !== '__otro__') registrarNuevaSuperficie(input.value);
  });
  document.querySelectorAll('.acabado-val').forEach(input => {
    if (input.value && input.value !== '__otro__') registrarNuevoAcabado(input.value);
  });
  proyectoActualId = null;
  contadorAmbientes = 0;
  document.getElementById('clienteNombre').value = '';
  document.getElementById('direccionProyecto').value = '';
  document.getElementById('ambientesContainer').innerHTML = '';
  agregarAmbiente();
  cargarCatalogos();
  calcularTotales();
  mostrarNotificacion('Nueva Medición', 'Formulario limpiado para un nuevo proyecto.', '✨', 'bg-blue-100', 'text-blue-600');
}

// --- AMBIENTES Y MEDICIONES ---
function verificarPersiana(idAmbiente) {
  const ambEl = document.getElementById(idAmbiente);
  const superficie = ambEl.querySelector('.superficie-val').value.toLowerCase().trim();
  const attrs = ambEl.querySelector('.persiana-attrs');
  if (superficie === 'persiana') {
    attrs.classList.remove('hidden');
  } else {
    attrs.classList.add('hidden');
  }
}

function agregarAmbiente(datos = null) {
  contadorAmbientes++;
  const idAmbiente = `ambiente-${contadorAmbientes}`;
  const nombreInicial = datos ? datos.nombre : '';
  const superficieInicial = datos ? datos.superficie : '';
  const acabadoInicial = datos ? datos.acabado : '';
  const desperdicioInicial = datos ? datos.desperdicio : '0';

  const ambienteHTML = `
    <div id="${idAmbiente}" class="ambiente-card bg-white p-4 rounded-xl shadow-sm border border-slate-200 space-y-3">
      <div class="flex justify-between items-center border-b pb-2">
        <input type="text" list="listaAmbientes" placeholder="Ej: Baño, Piscina" class="ambiente-nombre font-semibold text-sm text-slate-800 focus:outline-none focus:border-b focus:border-blue-500 w-2/3" value="${nombreInicial}" onchange="registrarNuevoAmbiente(this.value)" onblur="registrarNuevoAmbiente(this.value)">
        <button onclick="eliminarElemento('${idAmbiente}')" class="text-red-500 text-xs font-bold px-2 py-1 bg-red-50 rounded">Eliminar</button>
      </div>

      <div class="grid grid-cols-2 gap-2 bg-slate-50 p-2 rounded-lg border border-slate-200 text-xs">
        <div>
          <label class="block text-[10px] font-bold text-slate-500 mb-0.5">SUPERFICIE / TIPO</label>
          <select class="superficie-val w-full bg-white border border-slate-300 rounded px-2 py-1 font-medium focus:outline-none focus:ring-1 focus:ring-blue-500" onchange="onCambioSuperficie(this, '${idAmbiente}')">
            ${generarOpcionesSuperficies(superficieInicial)}
          </select>
        </div>
        <div>
          <label class="block text-[10px] font-bold text-slate-500 mb-0.5">ACABADO / FORMATO</label>
          <select class="acabado-val w-full bg-white border border-slate-300 rounded px-2 py-1 font-medium focus:outline-none focus:ring-1 focus:ring-blue-500" onchange="onCambioAcabado(this)">
            ${generarOpcionesAcabados(acabadoInicial)}
          </select>
        </div>
      </div>

      <div class="persiana-attrs hidden bg-purple-50 p-2 rounded-lg border border-purple-200 text-xs space-y-2">
        <span class="text-[10px] font-bold text-purple-600 uppercase">Atributos Persiana</span>
        <div class="grid grid-cols-3 gap-2">
          <div>
            <label class="block text-[10px] font-bold text-slate-500 mb-0.5">MANDO</label>
            <select class="persiana-mando w-full bg-white border border-slate-300 rounded px-1 py-1 font-medium">
              <option value="izquierdo" ${datos && datos.persiana && datos.persiana.mando === 'izquierdo' ? 'selected' : ''}>Izquierdo</option>
              <option value="derecho" ${datos && datos.persiana && datos.persiana.mando === 'derecho' ? 'selected' : ''}>Derecho</option>
            </select>
          </div>
          <div>
            <label class="block text-[10px] font-bold text-slate-500 mb-0.5">CENEFA</label>
            <select class="persiana-cenefa w-full bg-white border border-slate-300 rounded px-1 py-1 font-medium">
              <option value="no" ${datos && datos.persiana && datos.persiana.cenefa === 'si' ? '' : 'selected'}>No</option>
              <option value="si" ${datos && datos.persiana && datos.persiana.cenefa === 'si' ? 'selected' : ''}>Sí</option>
            </select>
          </div>
          <div>
            <label class="block text-[10px] font-bold text-slate-500 mb-0.5">MOTORIZADA</label>
            <select class="persiana-motorizada w-full bg-white border border-slate-300 rounded px-1 py-1 font-medium">
              <option value="no" ${datos && datos.persiana && datos.persiana.motorizada === 'si' ? '' : 'selected'}>No</option>
              <option value="si" ${datos && datos.persiana && datos.persiana.motorizada === 'si' ? 'selected' : ''}>Sí</option>
            </select>
          </div>
        </div>
      </div>

      <div class="mediciones-container space-y-2"></div>

      <div class="flex gap-2 pt-1">
        <button onclick="agregarMedicion('${idAmbiente}', 'suma')" class="flex-1 py-1.5 bg-blue-50 text-blue-600 text-xs font-semibold rounded-lg hover:bg-blue-100">+ Tramo</button>
        <button onclick="agregarMedicion('${idAmbiente}', 'resta')" class="flex-1 py-1.5 bg-amber-50 text-amber-700 text-xs font-semibold rounded-lg hover:bg-amber-100">- Vano</button>
        <button onclick="abrirCroquis('${idAmbiente}')" class="flex-1 py-1.5 bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-200">✏️ Croquis</button>
      </div>

      <div class="croquis-preview hidden">
        <img class="croquis-img w-full rounded-lg border border-slate-200 mt-2" src="" alt="Croquis">
      </div>

      <div class="flex justify-between items-center pt-2 border-t text-xs">
        <label class="text-slate-500 font-medium">Desperdicio (%):</label>
        <select class="desperdicio-select bg-slate-50 border border-slate-300 rounded px-2 py-1 font-semibold" onchange="calcularTotales()">
          <option value="0" ${desperdicioInicial == '0' ? 'selected' : ''}>0%</option>
          <option value="5" ${desperdicioInicial == '5' ? 'selected' : ''}>5%</option>
          <option value="10" ${desperdicioInicial == '10' ? 'selected' : ''}>10%</option>
          <option value="15" ${desperdicioInicial == '15' ? 'selected' : ''}>15%</option>
        </select>
      </div>

      <div class="text-right text-xs pt-1 font-semibold text-slate-700">
        Subtotal: <span class="subtotal-val text-sm font-bold text-blue-600">0.00 m²</span>
      </div>
    </div>
  `;

  document.getElementById('ambientesContainer').insertAdjacentHTML('beforeend', ambienteHTML);

  if (datos && datos.mediciones && datos.mediciones.length > 0) {
    datos.mediciones.forEach(m => agregarMedicion(idAmbiente, m.tipo, m.largo, m.ancho, m.unidad || 'm2'));
  } else {
    agregarMedicion(idAmbiente, 'suma');
  }

  // Restaurar croquis si existe
  if (datos && datos.croquis) {
    const ambEl = document.getElementById(idAmbiente);
    const preview = ambEl.querySelector('.croquis-preview');
    const img = ambEl.querySelector('.croquis-img');
    img.src = datos.croquis;
    preview.classList.remove('hidden');
  }

  // Mostrar atributos de persiana si corresponde
  verificarPersiana(idAmbiente);
}

function agregarMedicion(idAmbiente, tipo, largo = '', ancho = '', unidad = '') {
  const ambienteEl = document.getElementById(idAmbiente);
  const container = ambienteEl.querySelector('.mediciones-container');
  
  // Heredar la unidad de la última medición existente si no se especifica
  if (!unidad) {
    const medicionesExistentes = container.querySelectorAll('.medicion-row');
    if (medicionesExistentes.length > 0) {
      const ultimaMedicion = medicionesExistentes[medicionesExistentes.length - 1];
      unidad = ultimaMedicion.querySelector('.unidad-val').value;
    } else {
      unidad = 'm2';
    }
  }
  
  const idMedicion = `med-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;

  const esSuma = tipo === 'suma';
  const colorBg = esSuma ? 'bg-slate-50' : 'bg-amber-50';
  const badgeText = esSuma ? '(+)' : '(-)';
  const badgeColor = esSuma ? 'bg-blue-100 text-blue-700' : 'bg-amber-200 text-amber-800';

  const medicionHTML = `
    <div id="${idMedicion}" class="medicion-row flex items-center gap-1.5 p-2 rounded-lg ${colorBg} text-xs" data-tipo="${tipo}">
      <span class="px-1.5 py-0.5 rounded text-[10px] font-bold ${badgeColor}">${badgeText}</span>
      
      <select class="unidad-val bg-white border border-slate-300 rounded text-[11px] font-bold p-1 focus:ring-1 focus:ring-blue-500" onchange="cambiarUnidadMedicion('${idMedicion}')">
        <option value="m2" ${unidad === 'm2' ? 'selected' : ''}>m²</option>
        <option value="m" ${unidad === 'm' ? 'selected' : ''}>ml</option>
      </select>

      <input type="number" step="0.01" inputmode="decimal" placeholder="Largo" value="${largo}" readonly 
             onclick="abrirTeclado(this, 'Largo (m)')"
             class="largo-val w-1/3 p-2 bg-white border border-slate-300 rounded text-center font-bold text-sm cursor-pointer focus:ring-2 focus:ring-blue-500" oninput="calcularTotales()">
      
      <span class="multiplicador-sign text-slate-400 font-bold ${unidad === 'm' ? 'hidden' : ''}">×</span>
      
      <input type="number" step="0.01" inputmode="decimal" placeholder="Ancho" value="${ancho}" readonly 
             onclick="abrirTeclado(this, 'Ancho (m)')"
             class="ancho-val w-1/3 p-2 bg-white border border-slate-300 rounded text-center font-bold text-sm cursor-pointer focus:ring-2 focus:ring-blue-500 ${unidad === 'm' ? 'hidden' : ''}" oninput="calcularTotales()">
      
      <button onclick="eliminarElemento('${idMedicion}')" class="text-slate-400 hover:text-red-500 font-bold px-1 ml-auto">✕</button>
    </div>
  `;

  container.insertAdjacentHTML('beforeend', medicionHTML);
  calcularTotales();
}

function cambiarUnidadMedicion(idMedicion) {
  const medicionRow = document.getElementById(idMedicion);
  const unidad = medicionRow.querySelector('.unidad-val').value;
  const anchoInput = medicionRow.querySelector('.ancho-val');
  const multiplicador = medicionRow.querySelector('.multiplicador-sign');

  if (unidad === 'm') {
    anchoInput.classList.add('hidden');
    multiplicador.classList.add('hidden');
    anchoInput.value = '';
  } else {
    anchoInput.classList.remove('hidden');
    multiplicador.classList.remove('hidden');
  }
  calcularTotales();
}

function eliminarElemento(id) {
  document.getElementById(id).remove();
  calcularTotales();
}

function calcularTotales() {
  let granTotalM2 = 0;
  let granTotalM = 0;
  let totalPersianas = 0;

  document.querySelectorAll('.ambiente-card').forEach(amb => {
    let areaBaseM2 = 0;
    let metroBaseM = 0;
    const superficie = amb.querySelector('.superficie-val').value.toLowerCase().trim();
    const esPersiana = superficie === 'persiana';

    amb.querySelectorAll('.medicion-row').forEach(med => {
      const largo = parseFloat(med.querySelector('.largo-val').value) || 0;
      const ancho = parseFloat(med.querySelector('.ancho-val').value) || 0;
      const unidad = med.querySelector('.unidad-val').value;
      const tipo = med.getAttribute('data-tipo');

      if (unidad === 'm2') {
        const area = largo * ancho;
        if (tipo === 'suma') areaBaseM2 += area;
        else areaBaseM2 -= area;
      } else if (unidad === 'm') {
        if (tipo === 'suma') metroBaseM += largo;
        else metroBaseM -= largo;
      }
    });

    if (areaBaseM2 < 0) areaBaseM2 = 0;
    if (metroBaseM < 0) metroBaseM = 0;

    const desperdicioPct = parseFloat(amb.querySelector('.desperdicio-select').value) || 0;
    const totalAmbienteM2 = areaBaseM2 * (1 + desperdicioPct / 100);
    const totalAmbienteM = metroBaseM * (1 + desperdicioPct / 100);

    let subtotalTexto = '';
    if (totalAmbienteM2 > 0) subtotalTexto += `${totalAmbienteM2.toFixed(2)} m²`;
    if (totalAmbienteM > 0) {
      if (subtotalTexto !== '') subtotalTexto += ' | ';
      subtotalTexto += `${totalAmbienteM.toFixed(2)} ml`;
    }
    amb.querySelector('.subtotal-val').innerText = subtotalTexto || '0.00 m²';

    if (esPersiana) {
      totalPersianas += totalAmbienteM2 + totalAmbienteM;
    } else {
      granTotalM2 += totalAmbienteM2;
      granTotalM += totalAmbienteM;
    }
  });

  let resumenHTML = '';
  if (granTotalM2 > 0) {
    resumenHTML += `${granTotalM2.toFixed(2)} <span class="text-sm">m²</span>`;
  }
  if (granTotalM > 0) {
    if (resumenHTML !== '') resumenHTML += ` <span class="text-lg font-normal text-blue-200">/</span> `;
    resumenHTML += `${granTotalM.toFixed(2)} <span class="text-sm">ml</span>`;
  }
  if (resumenHTML === '') resumenHTML = `0.00 <span class="text-sm">m²</span>`;
  document.getElementById('granTotal').innerHTML = resumenHTML;

  // Mostrar persianas aparte
  const persianaResumen = document.getElementById('resumenPersianas');
  if (totalPersianas > 0) {
    persianaResumen.classList.remove('hidden');
    persianaResumen.querySelector('.persianas-total').innerText = totalPersianas.toFixed(2);
  } else {
    persianaResumen.classList.add('hidden');
  }

}

// --- GUARDADO E HISTORIAL ---
function obtenerEstructuraProyecto() {
  const cliente = document.getElementById('clienteNombre').value || 'Sin Nombre';
  const direccion = document.getElementById('direccionProyecto').value || '';
  const total = document.getElementById('granTotal').innerText;
  
  const ambientes = [];
  document.querySelectorAll('.ambiente-card').forEach(amb => {
    const nombre = amb.querySelector('.ambiente-nombre').value;
    const superficie = amb.querySelector('.superficie-val').value || 'Piso';
    const acabado = amb.querySelector('.acabado-val').value;
    const desperdicio = amb.querySelector('.desperdicio-select').value;
    
    if (superficie) registrarNuevaSuperficie(superficie);
    if (acabado) registrarNuevoAcabado(acabado);
    if (nombre) registrarNuevoAmbiente(nombre);

    const mediciones = [];
    amb.querySelectorAll('.medicion-row').forEach(med => {
      mediciones.push({
        tipo: med.getAttribute('data-tipo'),
        unidad: med.querySelector('.unidad-val').value,
        largo: med.querySelector('.largo-val').value,
        ancho: med.querySelector('.ancho-val').value
      });
    });

    // Obtener croquis si existe
    const croquisImg = amb.querySelector('.croquis-img');
    const croquisData = (croquisImg && croquisImg.src && croquisImg.src.startsWith('data:image')) ? croquisImg.src : null;

    // Obtener datos de persiana si aplica
    let persianaData = null;
    if (superficie.toLowerCase() === 'persiana') {
      persianaData = {
        mando: amb.querySelector('.persiana-mando').value,
        cenefa: amb.querySelector('.persiana-cenefa').value,
        motorizada: amb.querySelector('.persiana-motorizada').value
      };
    }

    ambientes.push({ nombre, superficie, acabado, desperdicio, mediciones, croquis: croquisData, persiana: persianaData });
  });

  return {
    id: proyectoActualId || `proj-${Date.now()}`,
    fecha: new Date().toLocaleDateString('es-ES'),
    cliente,
    direccion,
    total,
    ambientes
  };
}

function guardarProyecto() {
  const cliente = document.getElementById('clienteNombre').value.trim();
  const direccion = document.getElementById('direccionProyecto').value.trim();

  if (!cliente || !direccion) {
    mostrarNotificacion('Datos incompletos', 'Debes ingresar el nombre del proyecto y la dirección antes de guardar.', '⚠️', 'bg-amber-100', 'text-amber-700');
    if (!cliente) document.getElementById('clienteNombre').focus();
    else document.getElementById('direccionProyecto').focus();
    return;
  }

  const proyecto = obtenerEstructuraProyecto();
  let historial = JSON.parse(localStorage.getItem('historialMediciones') || '[]');
  const index = historial.findIndex(p => p.id === proyecto.id);
  if (index >= 0) historial[index] = proyecto;
  else historial.unshift(proyecto);
  localStorage.setItem('historialMediciones', JSON.stringify(historial));
  proyectoActualId = proyecto.id;
  mostrarNotificacion('¡Medición Guardada!', 'Los datos se guardaron correctamente.');
}

function abrirHistorial() {
  document.getElementById('buscarHistorial').value = '';
  renderHistorial('');
  document.getElementById('modalHistorial').classList.remove('hidden');
}

function filtrarHistorial() {
  const filtro = document.getElementById('buscarHistorial').value.trim().toLowerCase();
  renderHistorial(filtro);
}

function renderHistorial(filtro) {
  const historial = JSON.parse(localStorage.getItem('historialMediciones') || '[]');
  const container = document.getElementById('listaHistorial');
  container.innerHTML = '';

  const filtrados = filtro
    ? historial.filter(p => (p.cliente + ' ' + p.direccion).toLowerCase().includes(filtro))
    : historial;

  if (filtrados.length === 0) {
    container.innerHTML = '<p class="text-xs text-slate-400 text-center py-4">No hay mediciones que coincidan.</p>';
  } else {
    filtrados.forEach(p => {
      const direccion = p.direccion || 'Sin dirección';
      container.insertAdjacentHTML('beforeend', `
        <div class="p-3 bg-slate-50 border rounded-xl flex justify-between items-center text-xs">
          <div class="flex-1 min-w-0 mr-2">
            <div class="font-bold text-slate-800 truncate">${p.cliente}</div>
            <div class="text-[10px] text-slate-500 truncate">📍 ${direccion}</div>
            <div class="text-[10px] text-slate-400">${p.fecha} - ${p.total}</div>
          </div>
          <div class="flex gap-1 shrink-0">
            <button onclick="cargarProyecto('${p.id}')" class="px-2 py-1 bg-blue-600 text-white font-bold rounded">Cargar</button>
            <button onclick="eliminarProyecto('${p.id}')" class="px-2 py-1 bg-red-100 text-red-600 font-bold rounded">✕</button>
          </div>
        </div>
      `);
    });
  }
}

function cerrarHistorial() { document.getElementById('modalHistorial').classList.add('hidden'); }

function cargarProyecto(id) {
  const historial = JSON.parse(localStorage.getItem('historialMediciones') || '[]');
  const proyecto = historial.find(p => p.id === id);
  if (!proyecto) return;
  proyectoActualId = proyecto.id;
  document.getElementById('clienteNombre').value = proyecto.cliente;
  document.getElementById('direccionProyecto').value = proyecto.direccion;
  document.getElementById('ambientesContainer').innerHTML = '';
  contadorAmbientes = 0;
  proyecto.ambientes.forEach(amb => agregarAmbiente(amb));
  cerrarHistorial();
}

function eliminarProyecto(id) {
  let historial = JSON.parse(localStorage.getItem('historialMediciones') || '[]');
  historial = historial.filter(p => p.id !== id);
  localStorage.setItem('historialMediciones', JSON.stringify(historial));
  abrirHistorial();
}

// --- GENERACIÓN DE PDF ---
async function generarPDF(compartir = false) {
  // Esperar a que todas las imágenes de croquis estén cargadas
  const promesasImg = [];
  document.querySelectorAll('.croquis-img').forEach(img => {
    if (img.src && img.src.startsWith('data:image') && !img.complete) {
      promesasImg.push(new Promise(resolve => {
        img.onload = resolve;
        img.onerror = resolve;
      }));
    }
  });
  if (promesasImg.length > 0) await Promise.all(promesasImg);

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  const cliente = document.getElementById('clienteNombre').value || 'Cliente General';
  const direccion = document.getElementById('direccionProyecto').value || 'Sin especificar';
  const totalGeneral = document.getElementById('granTotal').innerText;

  doc.setFillColor(30, 41, 59);
  doc.rect(0, 0, 210, 25, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('REPORTE TÉCNICO DE MEDICIÓN DE ÁREAS', 14, 16);

  doc.setTextColor(51, 65, 85);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Cliente / Proyecto: ${cliente}`, 14, 34);
  doc.text(`Ubicación: ${direccion}`, 14, 40);
  doc.text(`Fecha: ${new Date().toLocaleDateString('es-ES')}`, 14, 46);

  const filas = [];
  document.querySelectorAll('.ambiente-card').forEach((amb, idx) => {
    const nombreAmbiente = amb.querySelector('.ambiente-nombre').value || `Ambiente ${idx + 1}`;
    const superficie = amb.querySelector('.superficie-val').value || 'Piso';
    const acabado = amb.querySelector('.acabado-val').value || 'Estándar';
    const desperdicio = amb.querySelector('.desperdicio-select').value;
    const subtotal = amb.querySelector('.subtotal-val').innerText;

    const detalles = [];
    amb.querySelectorAll('.medicion-row').forEach(med => {
      const largo = parseFloat(med.querySelector('.largo-val').value) || 0;
      const ancho = parseFloat(med.querySelector('.ancho-val').value) || 0;
      const unidad = med.querySelector('.unidad-val').value;
      const tipo = med.getAttribute('data-tipo');
      const signo = tipo === 'suma' ? '(+)' : '(-)';

      if (unidad === 'm2') {
        detalles.push(`${signo} ${largo}x${ancho}m²`);
      } else {
        detalles.push(`${signo} ${largo}m (ml)`);
      }
    });

    let descripcion = `${nombreAmbiente}\nElemento: ${superficie}\nAcabado: ${acabado}`;
    if (superficie.toLowerCase() === 'persiana') {
      const mando = amb.querySelector('.persiana-mando').value || 'izquierdo';
      const cenefa = amb.querySelector('.persiana-cenefa').value || 'no';
      const motorizada = amb.querySelector('.persiana-motorizada').value || 'no';
      descripcion += `\nMando: ${mando} | Cenefa: ${cenefa} | Motor: ${motorizada}`;
    }

    filas.push([
      descripcion,
      detalles.join(', '),
      `${desperdicio}%`,
      subtotal
    ]);
  });

  doc.autoTable({
    startY: 52,
    head: [['Ambiente / Detalles', 'Mediciones', 'Desperdicio', 'Total Material']],
    body: filas,
    headStyles: { fillStyle: 'F', fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold' },
    styles: { fontSize: 8.5, cellPadding: 3 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 55 },
      1: { cellWidth: 65 },
      2: { halign: 'center', cellWidth: 25 },
      3: { halign: 'right', fontStyle: 'bold', cellWidth: 35 }
    }
  });

  const finalY = doc.lastAutoTable.finalY + 10;
  doc.setFillColor(239, 246, 255);
  doc.rect(100, finalY, 96, 15, 'F');
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 58, 138);
  doc.text(`TOTAL MATERIAL: ${totalGeneral}`, 104, finalY + 10);

  // Total persianas separado si hay
  const persianaEl = document.getElementById('resumenPersianas');
  if (!persianaEl.classList.contains('hidden')) {
    const totalPers = persianaEl.querySelector('.persianas-total').innerText;
    doc.setFontSize(9);
    doc.setTextColor(100, 50, 150);
    doc.text(`PERSIANAS (Accesorios): ${totalPers} m²`, 14, finalY + 10);
  }

  // Agregar croquis al PDF
  let posY = finalY + 25;
  document.querySelectorAll('.ambiente-card').forEach((amb, idx) => {
    const croquisImg = amb.querySelector('.croquis-img');
    if (!croquisImg) return;
    const src = croquisImg.getAttribute('src') || croquisImg.src || '';
    
    if (src.startsWith('data:image')) {
      const nombreAmb = amb.querySelector('.ambiente-nombre').value || `Ambiente ${idx + 1}`;
      
      if (posY > 220) {
        doc.addPage();
        posY = 20;
      }
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(51, 65, 85);
      doc.text(`Croquis: ${nombreAmb}`, 14, posY);
      posY += 5;
      try {
        // Redimensionar croquis para PDF (max 400px ancho) para compatibilidad móvil
        const imgTemp = new Image();
        imgTemp.src = src;
        const canvasTemp = document.createElement('canvas');
        const maxAncho = 400;
        const ratio = imgTemp.naturalWidth ? Math.min(maxAncho / imgTemp.naturalWidth, 1) : 1;
        canvasTemp.width = (imgTemp.naturalWidth || 400) * ratio;
        canvasTemp.height = (imgTemp.naturalHeight || 300) * ratio;
        const ctxTemp = canvasTemp.getContext('2d');
        ctxTemp.drawImage(imgTemp, 0, 0, canvasTemp.width, canvasTemp.height);
        const srcReducido = canvasTemp.toDataURL('image/jpeg', 0.5);
        doc.addImage(srcReducido, 'JPEG', 14, posY, 90, 67);
      } catch (e) {
        console.warn('Error al agregar croquis al PDF:', e);
      }
      posY += 75;
    }
  });

  const nombreArchivo = `Medicion_${cliente.replace(/\s+/g, '_')}.pdf`;

  if (compartir) {
    const pdfBlob = doc.output('blob');
    const file = new File([pdfBlob], nombreArchivo, { type: 'application/pdf' });
    const fechaActual = new Date().toLocaleDateString('es-ES');
    const mensajeWhatsApp = `📋 *REPORTE DE MEDICIÓN DE ÁREAS*\n\n` +
                            `👤 *Cliente/Proyecto:* ${cliente}\n` +
                            `📍 *Ubicación:* ${direccion}\n` +
                            `📅 *Fecha:* ${fechaActual}\n` +
                            `📐 *Total Material:* ${totalGeneral}\n\n` +
                            `Adjunto encontrarás el informe detallado en formato PDF.`;

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({ title: `Reporte - ${cliente}`, text: mensajeWhatsApp, files: [file] });
      } catch (err) {
        if (err.name !== 'AbortError') doc.save(nombreArchivo);
      }
    } else {
      doc.save(nombreArchivo);
    }
  } else {
    // En móvil, abrir el PDF en nueva pestaña para visualización directa
    const pdfBlob = doc.output('blob');
    const blobUrl = URL.createObjectURL(pdfBlob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = nombreArchivo;
    link.click();
    setTimeout(() => URL.revokeObjectURL(blobUrl), 5000);
  }
}

// --- CROQUIS (DIBUJO A MANO ALZADA) ---
let croquisAmbienteActual = null;
let croquisCanvas = null;
let croquisCtx = null;
let dibujando = false;
let croquisHistorial = [];
let modoTexto = false;

function abrirCroquis(idAmbiente) {
  croquisAmbienteActual = idAmbiente;
  croquisHistorial = [];
  modoTexto = false;
  const modal = document.getElementById('modalCroquis');
  modal.classList.remove('hidden');

  croquisCanvas = document.getElementById('canvasCroquis');
  croquisCtx = croquisCanvas.getContext('2d');

  // Canvas más grande que el contenedor (scrollable)
  const contenedor = croquisCanvas.parentElement;
  const ancho = contenedor.offsetWidth - 10;
  croquisCanvas.width = ancho;
  croquisCanvas.height = ancho * 1.2; // Más alto para permitir scroll
  croquisCanvas.style.width = ancho + 'px';
  croquisCanvas.style.height = (ancho * 1.2) + 'px';

  // Fondo blanco
  croquisCtx.fillStyle = '#ffffff';
  croquisCtx.fillRect(0, 0, croquisCanvas.width, croquisCanvas.height);

  // Cargar croquis existente si hay
  const ambEl = document.getElementById(idAmbiente);
  const imgExistente = ambEl.querySelector('.croquis-img');
  if (imgExistente && imgExistente.src && imgExistente.src.startsWith('data:image')) {
    const img = new Image();
    img.onload = function () {
      croquisCtx.drawImage(img, 0, 0, croquisCanvas.width, croquisCanvas.height);
      guardarEstadoCroquis();
    };
    img.src = imgExistente.src;
  } else {
    guardarEstadoCroquis();
  }

  // Configurar trazo
  croquisCtx.strokeStyle = '#1e293b';
  croquisCtx.lineWidth = 3;
  croquisCtx.lineCap = 'round';
  croquisCtx.lineJoin = 'round';

  // Event listeners táctiles y mouse
  croquisCanvas.addEventListener('mousedown', iniciarTrazo);
  croquisCanvas.addEventListener('mousemove', dibujarTrazo);
  croquisCanvas.addEventListener('mouseup', finalizarTrazo);
  croquisCanvas.addEventListener('mouseleave', finalizarTrazo);
  croquisCanvas.addEventListener('touchstart', iniciarTrazoTouch, { passive: false });
  croquisCanvas.addEventListener('touchmove', dibujarTrazoTouch, { passive: false });
  croquisCanvas.addEventListener('touchend', finalizarTrazo);
}

function cerrarCroquis() {
  document.getElementById('modalCroquis').classList.add('hidden');
  if (croquisCanvas) {
    croquisCanvas.removeEventListener('mousedown', iniciarTrazo);
    croquisCanvas.removeEventListener('mousemove', dibujarTrazo);
    croquisCanvas.removeEventListener('mouseup', finalizarTrazo);
    croquisCanvas.removeEventListener('mouseleave', finalizarTrazo);
    croquisCanvas.removeEventListener('touchstart', iniciarTrazoTouch);
    croquisCanvas.removeEventListener('touchmove', dibujarTrazoTouch);
    croquisCanvas.removeEventListener('touchend', finalizarTrazo);
  }
  croquisAmbienteActual = null;
}

function guardarCroquis() {
  if (!croquisCanvas || !croquisAmbienteActual) return;
  // Usar JPEG con calidad 0.6 para reducir tamaño en localStorage
  const dataURL = croquisCanvas.toDataURL('image/jpeg', 0.6);
  const ambEl = document.getElementById(croquisAmbienteActual);
  const preview = ambEl.querySelector('.croquis-preview');
  const img = ambEl.querySelector('.croquis-img');
  img.src = dataURL;
  preview.classList.remove('hidden');
  cerrarCroquis();
}

function limpiarCroquis() {
  if (!croquisCanvas || !croquisCtx) return;
  croquisCtx.fillStyle = '#ffffff';
  croquisCtx.fillRect(0, 0, croquisCanvas.width, croquisCanvas.height);
  croquisHistorial = [];
  guardarEstadoCroquis();
}

function deshacerCroquis() {
  if (croquisHistorial.length > 1) {
    croquisHistorial.pop();
    const imgData = croquisHistorial[croquisHistorial.length - 1];
    const img = new Image();
    img.onload = function () {
      croquisCtx.clearRect(0, 0, croquisCanvas.width, croquisCanvas.height);
      croquisCtx.drawImage(img, 0, 0);
    };
    img.src = imgData;
  } else {
    limpiarCroquis();
  }
}

function guardarEstadoCroquis() {
  if (croquisCanvas) {
    croquisHistorial.push(croquisCanvas.toDataURL());
  }
}

function cambiarGrosorCroquis(grosor) {
  if (croquisCtx) croquisCtx.lineWidth = grosor;
  // Desactivar modo texto al cambiar grosor
  if (modoTexto) toggleModoTexto();
  document.querySelectorAll('.grosor-btn').forEach(btn => btn.classList.remove('ring-2', 'ring-blue-500'));
  event.target.classList.add('ring-2', 'ring-blue-500');
}

function cambiarColorCroquis(color) {
  if (croquisCtx) croquisCtx.strokeStyle = color;
  document.querySelectorAll('.color-btn').forEach(btn => btn.classList.remove('ring-2', 'ring-offset-1'));
  event.target.classList.add('ring-2', 'ring-offset-1');
}

// --- Eventos de dibujo ---
function obtenerPosicion(e) {
  const rect = croquisCanvas.getBoundingClientRect();
  return {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top
  };
}

function iniciarTrazo(e) {
  if (modoTexto) {
    const pos = obtenerPosicion(e);
    textoPosX = pos.x;
    textoPosY = pos.y;
    document.getElementById('modalTexto').classList.remove('hidden');
    document.getElementById('inputTextoCroquis').value = '';
    setTimeout(() => document.getElementById('inputTextoCroquis').focus(), 100);
    return;
  }
  dibujando = true;
  const pos = obtenerPosicion(e);
  croquisCtx.beginPath();
  croquisCtx.moveTo(pos.x, pos.y);
}

function dibujarTrazo(e) {
  if (!dibujando) return;
  const pos = obtenerPosicion(e);
  croquisCtx.lineTo(pos.x, pos.y);
  croquisCtx.stroke();
}

function finalizarTrazo() {
  if (dibujando) {
    dibujando = false;
    guardarEstadoCroquis();
  }
}

function iniciarTrazoTouch(e) {
  e.preventDefault();
  const touch = e.touches[0];
  const mouseEvent = new MouseEvent('mousedown', { clientX: touch.clientX, clientY: touch.clientY });
  iniciarTrazo(mouseEvent);
}

function dibujarTrazoTouch(e) {
  e.preventDefault();
  const touch = e.touches[0];
  const mouseEvent = new MouseEvent('mousemove', { clientX: touch.clientX, clientY: touch.clientY });
  dibujarTrazo(mouseEvent);
}

// --- MODO TEXTO ---
let textoPosX = 0;
let textoPosY = 0;

function toggleModoTexto() {
  modoTexto = !modoTexto;
  const btn = document.getElementById('btnModoTexto');
  if (modoTexto) {
    btn.classList.remove('bg-purple-100', 'text-purple-700');
    btn.classList.add('bg-purple-600', 'text-white');
    croquisCanvas.style.cursor = 'text';
  } else {
    btn.classList.remove('bg-purple-600', 'text-white');
    btn.classList.add('bg-purple-100', 'text-purple-700');
    croquisCanvas.style.cursor = 'crosshair';
  }
}

function confirmarTexto() {
  const texto = document.getElementById('inputTextoCroquis').value.trim();
  if (texto && croquisCtx) {
    const fontSize = Math.max(croquisCtx.lineWidth * 4, 14);
    croquisCtx.font = `bold ${fontSize}px Arial`;
    croquisCtx.fillStyle = croquisCtx.strokeStyle;
    
    // Ajustar posición si el texto se sale del canvas
    const medida = croquisCtx.measureText(texto);
    let x = textoPosX;
    let y = textoPosY;
    
    // Si se sale por la derecha, mover a la izquierda
    if (x + medida.width > croquisCanvas.width) {
      x = croquisCanvas.width - medida.width - 5;
    }
    // Si se sale por la izquierda
    if (x < 5) x = 5;
    // Si se sale por arriba
    if (y < fontSize) y = fontSize + 5;
    // Si se sale por abajo
    if (y > croquisCanvas.height - 5) y = croquisCanvas.height - 5;
    
    croquisCtx.fillText(texto, x, y);
    guardarEstadoCroquis();
  }
  document.getElementById('modalTexto').classList.add('hidden');
}

function cancelarTexto() {
  document.getElementById('modalTexto').classList.add('hidden');
}
